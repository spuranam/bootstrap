# Maintenance and updates

This guide covers the two roles that use this repository:

- **Consumers** synchronize a reviewed seed and apply its committed locks. They do not resolve or bump versions.
- **Seed maintainers** update requests and locks, validate the result, and publish reviewed changes.

The active config at `~/.config/mise` may be a Git checkout or an rsync-managed copy. The Git consumer workflow below
requires the active directory to be a checkout. For rsync-managed devices, update the reviewed source checkout and copy
from it using the rsync workflow below. Run bootstrap previews from the active config directory. For seed-maintenance
commands in a separate checkout, prefix mise with `MISE_CONFIG_DIR="$PWD"`. Read [validation](VALIDATION.md) for quality
gates and clean-device evidence; see [recovery](RECOVERY.md) if an update fails.

## Synchronize a consumer device

Review the incoming commit and bootstrap plan before updating the device. Keep any local changes out of the update:

```sh
cd "$HOME/.config/mise"
git status --short
git fetch origin
git log --oneline HEAD..origin/main
MISE_LOCKED=1 mise bootstrap --update --dry-run
# After reviewing and approving the plan:
MISE_LOCKED=1 mise bootstrap --update
mise doctor project
```

`--update` fast-forwards the configuration checkout; locked mode prevents an uncovered version or platform from being
resolved. It does not copy credentials or make bootstrap transactional. If strict mode reports missing lock coverage,
stop and send the failure to the seed maintainer rather than generating locks on the consumer device.

### Sync from a reviewed local checkout with rsync

Use this one-way copy when the reviewed seed is available as a local checkout, such as on a mounted volume, and you
prefer not to update `~/.config/mise` with Git. Set `SEED_CHECKOUT` to that checkout. Review its remote, working tree
and current commit:

```sh
export SEED_CHECKOUT="/path/to/reviewed/bootstrap"
git -C "$SEED_CHECKOUT" remote get-url origin
git -C "$SEED_CHECKOUT" status --short
git -C "$SEED_CHECKOUT" log -1 --oneline --decorate
```

If the source checkout needs an upstream update, fetch and inspect it before fast-forwarding. Skip this block when the
current source commit is the one you reviewed:

```sh
git -C "$SEED_CHECKOUT" fetch origin
git -C "$SEED_CHECKOUT" log --oneline HEAD..origin/main
# After reviewing the incoming commits:
git -C "$SEED_CHECKOUT" merge --ff-only origin/main
```

Adjust `origin/main` if the approved source uses a different remote branch. Sync only a reviewed commit; resolve or
discard unintended source changes first. For first-device setup, create the destination only after confirming it does
not exist, for example with `mkdir -p "$HOME/.config/mise"`. For an existing destination, back up or review local files
before syncing. Preview the file copy:

```sh
/usr/bin/rsync -aniv --checksum \
  --exclude='.git/' \
  --exclude='miserc.local.toml' \
  "$SEED_CHECKOUT/" \
  "$HOME/.config/mise/"
```

The trailing slash copies the checkout's contents. `--checksum` compares file contents even when size and timestamp
match. Review the itemized changes, then repeat the command without `-n` to copy. The exclusions keep source Git
metadata and the device-local capability selection out of the transfer; existing destination `.git` and
`miserc.local.toml` are left alone. This is a merge, not a mirror: without `--delete`, destination-only files remain.
Do not add `--delete` as a shortcut for cleanup.

Rsync transfers files only; it does not update Git history, install tools, or apply the new mise configuration. After
copying, run the locked bootstrap dry run from `~/.config/mise` and inspect dotfile changes as described in
[README Step 6](../README.md#step-6--preview-without-changing-the-workstation). Apply only the reviewed plan from
[README Step 7](../README.md#step-7--apply-the-approved-plan). For ongoing updates, use either this rsync workflow from
a reviewed source checkout or the Git workflow above. Do not run Git update commands in an rsync-managed destination
even if it retains `.git` metadata; rsync does not advance the destination's Git history.

## Update mise-managed tool versions

The version-update examples assume a Git checkout at `~/.config/mise`. For an rsync-managed device, run lock generation
and Git review in the reviewed source checkout. Replace `cd "$HOME/.config/mise"` with `cd "$SEED_CHECKOUT"` and prefix
each mise command with `MISE_CONFIG_DIR="$PWD"`. Then copy the reviewed changes to the active config and run its
bootstrap preview there.

The request in `config*.toml` expresses the allowed update policy: an exact version, release line such as `node = "26"`,
or rolling channel such as `gh = "latest"`. Committed lockfiles record a selected version for each supported platform.
Change the request only when deliberately changing that policy; ordinary upgrades of a rolling or release-line request
usually change only its lock entry.

For mise-managed `gcloud`, do not use `gcloud components update` as the workstation upgrade path. It changes the local
CLI and may move it beyond the version recorded in mise's lockfile; it does not update cloud resources. Use the reviewed
lock workflow below. See Google's [component management guide](https://docs.cloud.google.com/sdk/docs/components).

### Rolling or release-line request

In a reviewed seed branch, advance one tool at a time. This example advances gcloud:

```sh
cd "$HOME/.config/mise"
mise -E cloud lock --global --bump gcloud --dry-run
# Review the proposed resolution, then write the lock:
mise -E cloud lock --global --bump gcloud
git status --short
git diff -- config.cloud.toml '*.lock' 'locks/**'
MISE_LOCKED=1 mise -E cloud bootstrap --dry-run --skip task
```

Inspect new, untracked lockfiles and generated sidecars directly; normal `git diff` omits untracked files. After review,
test the locked install and applicable checks on a representative workstation before committing:

```sh
mise -E full install --locked
mise -E full run verify:core
```

Omit the tool name only when intentionally reviewing updates for all floating requests. Avoid `mise upgrade` and
`mise bootstrap --upgrade` as ways to bypass the lock review.

Consumers keep using committed locks; they do not run this resolution workflow on their workstation.

### Exact TOML pin

For an exact pin, first set the reviewed version in the owning configuration file, then resolve only that tool:

```sh
cd "$HOME/.config/mise"
# Edit config.toml to the reviewed exact version first.
mise -E full lock --global python --dry-run
mise -E full lock --global python
git status --short
git diff -- config.toml '*.lock' 'locks/**'
MISE_LOCKED=1 mise -E full bootstrap --dry-run --skip task
```

After review, validate using `mise -E full install --locked` and `mise -E full run verify:core`. Keep request and lock
changes together in the same reviewed change.

### Generate initial platform coverage

When the seed does not yet have lockfiles, its maintainer resolves the supported platforms before consumer bootstrap.
The dry run may read release metadata but does not install tools or write locks:

```sh
cd "$HOME/.config/mise"
mise -E full lock --global \
  --platform macos-arm64,linux-x64,linux-arm64 \
  --dry-run
# After reviewing resolutions, repeat without --dry-run:
mise -E full lock --global \
  --platform macos-arm64,linux-x64,linux-arm64
git status --short
git diff -- '*.lock' 'locks/**'
```

If supporting the optional Bitwarden capability, resolve its tool separately with the same platform list:

```sh
mise -E bitwarden lock --global 'npm:@bitwarden/cli' \
  --platform macos-arm64,linux-x64,linux-arm64 \
  --dry-run
# After review, repeat without --dry-run and inspect the generated files.
```

Never hand-write or guess lock metadata. Before designating a seed ready for consumers, follow the locked-install and
clean-device evidence requirements in [validation](VALIDATION.md).

## Upgrade Homebrew formulae on macOS

Homebrew formula declarations use `"latest"` as a presence policy: ordinary apply accepts the installed version and
does not upgrade it. Formula upgrades are separate from mise tool lock updates and are not recorded in mise lockfiles.
Review them independently:

```sh
mise bootstrap packages upgrade --manager brew --dry-run
# After reviewing and explicitly approving package-manager changes:
mise bootstrap packages upgrade --manager brew
mise run macos:brew-check
```

## Review and publish the seed

Before committing, confirm the expected remote, local Git author identity and every staged path for secrets. Include
generated locks and sidecars when they change:

```sh
cd "$HOME/.config/mise"
git remote get-url origin
# Expected: https://github.com/spuranam/bootstrap.git
git status --short
git add .
git diff --cached --check
git diff --cached --name-only
# Inspect the complete staged diff before continuing:
git diff --cached
git commit -m 'Update declarative mise workstation'
```

Push only after separately approving publication:

```sh
git push origin HEAD
```

Do not publish from a managed device unless policy permits it. Seed publication is never part of bootstrap.
