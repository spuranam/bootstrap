# mise-workstation

This project provisions a portable development workstation with native mise configuration. It provides a common
runtime foundation, optional desktop/AI/cloud/Kubernetes/supply-chain capabilities, opt-in credential integrations,
per-device authentication, locked tool versions, diagnostics and recovery guidance.

The repository is executable infrastructure. Review it and every dry run before applying it, especially on an
employer-managed device. Configuration parsing, CI and dry runs do not prove that every GUI, SSO or MDM path works on
every machine; the validation guide separates static checks from real-device acceptance.

- [Architecture and responsibility boundaries](ARCHITECTURE.md)
- [Architecture decisions and tradeoffs](DECISIONS.md)
- [Credentials](docs/CREDENTIALS.md)
- [Security](docs/SECURITY.md)
- [Maintenance and updates](docs/MAINTENANCE.md)
- [Validation](docs/VALIDATION.md)
- [Recovery](docs/RECOVERY.md)

## Start here

Follow the numbered workflow once from top to bottom. Every machine starts from the same reviewed seed repository.
Steps 4, 6 and 7 show capability examples; use the same selection throughout.

| Situation | Repository source | Typical capability selection |
| --- | --- | --- |
| Initial personal macOS workstation | Reviewed GitHub seed repository | `dev` or `full` |
| Additional personal macOS workstation | Reviewed GitHub seed repository | `dev` or `full` |
| Approved managed macOS workstation | Approved seed mirror/source distribution | Only employer-approved modules |
| Linux development workstation | Reviewed GitHub seed repository | `platform`, `dev` or a custom subset |
| Headless Linux server | Reviewed GitHub seed repository | Foundation only |

Do not run mise itself as root. Ubuntu/Fedora prerequisites and Linux package installation may require `sudo`; on
macOS, creating the Homebrew prefix may also require it. Review and approve each expected prompt. Software installation,
authentication, non-dry-run bootstrap, Git publication and cloud changes require explicit human approval.

## Requirements and capabilities

- mise **2026.11.8 or newer** on macOS Apple Silicon, Ubuntu LTS or Fedora.
- One active global mise configuration at `~/.config/mise`, populated from a reviewed Git seed by direct clone or the
  documented one-way rsync workflow.
- No native Windows/WSL support in v5.
- No secrets, SSH private keys, OAuth refresh tokens, PATs or `BW_SESSION` values in this repository.
- GUI applications and authentication remain subject to operating-system and employer policy.

| Selection | Modules | Intended use |
| --- | --- | --- |
| Foundation | None | Common runtimes/CLIs; GNU-first Homebrew command environment on macOS |
| `dev` | `desktop`, `ai`, `cloud` | Personal GUI development workstation |
| `platform` | `cloud`, `kubernetes`, `supply-chain` | Cloud/platform engineering without desktop or AI modules |
| `full` | All general workstation modules | Workstation needing every non-credential capability |
| Custom | Any comma-separated modules | Policy-constrained or specialized device |

The available optional modules are:

| Module | Provides |
| --- | --- |
| `desktop` | VS Code, Ghostty, iTerm2 and Go Mono Nerd Font on macOS; optional VS Code Git tools |
| `ai` | Herdr terminal UI, OpenCode, fnox and conservative nonsecret OpenCode defaults |
| `cloud` | Google Cloud CLI, authentication tasks and Python runtime checks |
| `kubernetes` | kubectl, OpenShift `oc`, Helm, Tekton `tkn` and k9s |
| `supply-chain` | cosign, syft, grype and trivy |
| `bitwarden` | Optional Bitwarden CLI and Bitwarden Desktop on macOS |

On macOS, the `desktop` capability installs Visual Studio Code through its Homebrew cask. The same declaration manages
the `/opt/homebrew/bin/code` and `/opt/homebrew/bin/code-tunnel` links; no separate “Shell Command: Install 'code'
command in PATH” action is required.

Selecting `desktop` also seeds missing Git editor, diff and merge tool settings for VS Code. The merge keeps existing
user values; use this capability where the `code` CLI is installed. Portable Git defaults such as
`init.defaultBranch`, `pull.ff` and `fetch.prune` remain in the core configuration. `fetch.prune` removes stale
remote-tracking references during fetch; it does not delete local branches. `push.autoSetupRemote` remains unset because
automatic upstream selection may not fit fork or multi-remote workflows. Git author identity and signing keys remain
local to each user/device.

The `ai` capability manages the [Herdr terminal UI](https://herdr.dev/tui/docs/install/) through mise and the committed
lockfile. This is separate from the Herdr desktop app (`herdr-app`), which is not installed by this configuration.
Keep CLI upgrades in the seed review workflow; don't run `herdr update` on a mise-managed install.

`bitwarden` is deliberately excluded from `dev`, `platform` and `full`. Select it explicitly only when the device uses
Bitwarden. SSH may use any approved agent, and fnox defaults to the operating-system keychain; neither requires
Bitwarden.

Selections are device-local. `mise -E dev` selects an environment for one command; bootstrap `--save-env` writes the
choice to ignored `miserc.local.toml`. Do not commit personal/work profiles. A manual template is available at
[`examples/miserc.local.toml`](examples/miserc.local.toml).

## Mise usage quick reference

Run normal workstation commands from `~/.config/mise`, where the global configuration is active. For a source checkout
outside that directory, prefix mise commands with `MISE_CONFIG_DIR="$PWD"`.

### Everyday workstation use

```sh
cd "$HOME/.config/mise"
mise config ls
mise ls --current
mise run verify:core
# Run one selected module task without changing the saved device selection.
mise -E cloud run cloud:python-check
```

### Preview and apply a capability change

Use the same selection for the preview and apply. Inspect both the bootstrap plan and dotfile changes before applying:

```sh
MISE_LOCKED=1 mise -E dev bootstrap --dry-run
mise -E dev dot diff
# After reviewing the plan and approving the workstation changes:
MISE_LOCKED=1 mise -E dev bootstrap --save-env
```

For consumer updates and maintainer-owned version, lockfile and seed publication workflows, see
[Maintenance and updates](docs/MAINTENANCE.md). Consumers do not bump locks.

This repository sets `auto_install = false`. Running a task, `mise exec`, or a command that happens to match a missing
configured tool will not install software implicitly. Use the reviewed dry-run and bootstrap steps below for
workstation tools; install task-only maintenance tools explicitly as described under repository maintenance.

### macOS Homebrew formula policy

On Apple Silicon, the foundation declares `coreutils`, `gnu-tar`, `gnu-sed`, `gnu-getopt`, `gawk`, `findutils`, `grep`,
`make`, `openssl@3`, `binutils`, `git` and `zsh-completions` through mise's `brew:` bootstrap manager. Mise can install
these formulae into `/opt/homebrew` without requiring the interactive Homebrew CLI; an existing Homebrew installation
recognizes the same packages.

The shared macOS PATH deliberately puts each formula's `gnubin` directory before the operating-system paths. Commands
such as `awk`, `date`, `find`, `grep`, `ls`, `make`, `sed`, `tar` and `xargs` therefore use GNU implementations without
a `g` prefix. The prefixed names such as `gawk`, `gdate`, `gfind`, `ggrep`, `gls`, `gmake`, `gsed` and `gtar` remain
available when a script benefits from being explicit.

The PATH also prefers Homebrew's `gnu-getopt`, keg-only GNU `binutils` commands and `openssl@3` CLI. This is an
intentional workstation-wide policy managed by mise, not an incidental local-shell customization. It changes common
macOS command semantics, so scripts intended for unmanaged Macs must not assume this environment. The repository still
uses macOS `/bin/zsh` and does not set global compiler/linker flags; projects needing keg-only headers or libraries must
set their own build environment.

## Canonical workstation workflow

### Step 1 — Prepare the operating system

On **macOS**, complete Setup Assistant, software updates, FileVault and any required MDM enrollment. Install Apple's
Command Line Tools if needed:

```sh
xcode-select -p || xcode-select --install
git --version
```

On **Ubuntu**:

```sh
sudo apt-get update
sudo apt-get install -y git curl ca-certificates
```

On **Fedora**:

```sh
sudo dnf install -y git curl ca-certificates
```

### Step 2 — Install mise

Use an approved package manager or review and use the official installer:

```sh
curl -fsSL https://mise.run | sh
export PATH="$HOME/.local/bin:$HOME/bin:$PATH"
mise --version
```

The official installer normally uses `~/.local/bin`; the second entry also supports an already approved standalone
binary in `~/bin`. Do not continue until `mise --version` succeeds. Installing mise does not authenticate GitHub,
Google Cloud, Bitwarden or an AI provider.

### Step 3 — Obtain and review this repository

For first-device setup, stop if `~/.config/mise` already exists. Back it up and determine what must be preserved; do not
replace, merge or delete an existing configuration automatically. For an existing device, choose the reviewed Git or
rsync procedure in [Maintenance and updates](docs/MAINTENANCE.md).

Use one of these ways to populate `~/.config/mise`. Direct clone keeps the active config Git-backed. The rsync option
copies files from a reviewed local checkout; see
[Maintenance and updates](docs/MAINTENANCE.md#sync-from-a-reviewed-local-checkout-with-rsync).

#### Clone the reviewed GitHub seed

The canonical seed is <https://github.com/spuranam/bootstrap>. If access requires authentication, establish it on this
device using an approved SSH agent or GitHub browser flow. The following `gh@latest` invocation is a narrow bootstrap
exception because the locked global configuration has not been cloned yet; skip these two commands when anonymous
HTTPS clone is permitted:

```sh
mkdir -p "$HOME/.config"
export PATH="$HOME/.local/bin:$HOME/bin:$PATH"
mise exec gh@latest -- gh auth login --hostname github.com --git-protocol https --web
mise exec gh@latest -- gh auth setup-git --hostname github.com
# Run only after confirming ~/.config/mise does not exist:
git clone \
  https://github.com/spuranam/bootstrap.git \
  "$HOME/.config/mise"
cd "$HOME/.config/mise"
git remote get-url origin
git log -1 --oneline --decorate
```

Confirm that `origin` is the canonical URL above, then review `config*.toml`, `miserc.toml`, `.gitignore`, `dotfiles/`,
the latest commit and the security documentation. If GitHub OAuth/SSH is prohibited, use an organization-approved
mirror or source distribution and record its provenance. `mise bootstrap --adopt` is not part of this setup flow.

### Step 4 — Choose one capability selection

Choose the smallest selection the device needs and that policy permits:

```sh
# Personal development Mac
mise -E dev config ls

# Cloud/platform workstation
mise -E platform config ls

# Every general workstation capability (no credential provider)
mise -E full config ls

# dev plus the optional Bitwarden integration
mise -E desktop,ai,cloud,bitwarden config ls

# Example managed-device subset
mise -E cloud,kubernetes,supply-chain config ls

# Foundation-only server
mise config ls
```

Use the same selection in the lock validation, preview and apply steps. Do not add a work/personal profile to the shared
configuration.

### Step 5 — Establish reproducible tool resolution

Mise separates the requested update policy from the reproducible installation:

| Mechanism | Meaning |
| --- | --- |
| `config*.toml` | Allowed request: exact (`python = "3.14.10"`), release line (`node = "26"`) or rolling (`gh = "latest"`) |
| `mise*.lock` and `locks/` | Exact resolved tool versions, artifact metadata and dependency graphs to commit |
| `--locked` or `MISE_LOCKED=1` | Fail instead of resolving a tool or platform that committed locks do not cover |

`latest` in TOML is an update channel, not the installed version once a matching lock is committed. A deliberate future
`mise lock --bump` may advance it; ordinary consumer bootstrap must not.

#### Consumer machines: require existing locks

Do not run `mise lock` or `mise lock --bump`. Review the committed TOML and lockfiles, then use strict locked mode in
the following preview and apply steps. A missing tool, checksum or platform entry must fail and be fixed through a
reviewed repository update.

Lockfiles make mise-managed tool resolution reproducible where the selected backend records the required metadata.
They do not freeze apt/dnf repositories, Homebrew casks, vendor services, credentials or GUI authorization, and they do
not make downloads offline.

Seed maintainers generating initial platform coverage or updating tool versions should follow
[Maintenance and updates](docs/MAINTENANCE.md). Consumers stop after this step and use only the committed locks.

### Step 6 — Preview without changing the workstation

Run the command matching Step 4. Examples:

```sh
# dev, platform or full workstation
MISE_LOCKED=1 mise -E dev bootstrap --dry-run

# Foundation-only server
MISE_LOCKED=1 mise bootstrap --dry-run

# Example managed-device subset
MISE_LOCKED=1 mise -E cloud,kubernetes,supply-chain bootstrap --dry-run

# dev plus an explicitly selected credential integration
MISE_LOCKED=1 mise -E desktop,ai,cloud,bitwarden bootstrap --dry-run

# Inspect managed dotfile changes separately
mise dot diff
```

Review packages, tools, dotfile edits and tasks. Resolve missing lock coverage instead of removing locked mode. Do not
continue until the plan is understood and approved.

On macOS, this repository manages only the mise activation block and a conditional source of untracked
`~/.zshrc.local`; personal or organization-specific shell configuration belongs in that local file. If `~/.zshrc` is a
symlink, the preview intentionally fails because mise will not edit through it. Use the reviewed one-time migration in
Step 7 instead of forcing dotfile replacement.

### Step 7 — Apply the approved plan

#### One-time migration for a symlinked `~/.zshrc`

Skip this subsection when `~/.zshrc` is already a regular file. Confirm the symlink target and that
`~/.zshrc.local` and the backup name do not exist, then preserve both the original target and the symlink:

```sh
test -L "$HOME/.zshrc"
test ! -e "$HOME/.zshrc.local"
test ! -e "$HOME/.zshrc.pre-mise-symlink"
legacy_zshrc="$(realpath "$HOME/.zshrc")"
cp -p "$legacy_zshrc" "$HOME/.zshrc.local"
mv "$HOME/.zshrc" "$HOME/.zshrc.pre-mise-symlink"
mise dot apply --dry-run "$HOME/.zshrc"
mise bootstrap mise-shell-activate apply --dry-run
```

After reviewing those two targeted previews, apply only the bridge and activation blocks:

```sh
mise dot apply "$HOME/.zshrc"
mise bootstrap mise-shell-activate apply
```

The original symlink target remains unchanged for rollback. Do not commit `~/.zshrc.local`; keep secrets out of shell
startup files even when they are untracked.

Run only the approved counterpart to the preview. For example:

```sh
# Personal development Mac; saves dev as this device's ignored selection
MISE_LOCKED=1 mise -E dev bootstrap --save-env

# Or a foundation-only server
# MISE_LOCKED=1 mise bootstrap
```

For `platform`, `full` or a custom subset such as `desktop,ai,cloud,bitwarden`, replace `dev` with the exact selection
previewed in Step 6. Never run a non-dry-run bootstrap under `sudo`.

#### macOS: Oh My Zsh reports insecure completion directories

If a new login shell reports `Insecure completion-dependent directories detected`, inspect the directories Oh My Zsh
flags:

```sh
compaudit
ls -ld /opt/homebrew/share
```

Only if `/opt/homebrew/share` is listed and its permissions include group or other write access, remove those write bits
from that directory and restart the login shell:

```sh
chmod g-w,o-w /opt/homebrew/share
exec zsh -l
```

For a different flagged directory, inspect its owner and permissions and apply the same targeted fix only when
appropriate. Do not run `compaudit | xargs chmod ...` blindly across every result, and do not disable Oh My Zsh's
completion security check to hide the warning.

Open a fresh login shell after bootstrap:

```sh
# macOS
exec zsh -l

# Linux
# exec bash -l
```

Linux GUI applications are not installed automatically because vendor repositories and Flatpak availability vary.
Install approved Bitwarden Desktop or VS Code separately when required.

### Step 8 — Establish identity on this device

Authentication is interactive and per-device. Do not copy credentials from another machine.

- **GitHub HTTPS:** Run `mise run auth:github-https`, then `mise run auth:github-status`.
- **GitHub SSH:** First enable an approved OS, hardware or vault-backed SSH agent and register only the public key. Then
  run
  `mise run auth:github-ssh`, `mise run auth:ssh-agent-status` and `mise run auth:github-ssh-status`.
- **Project secrets without Bitwarden:** Use fnox with the OS keychain example. Set each value interactively with
  `fnox set NAME --provider keychain`, then expose it only to an explicit `fnox exec -- command` child process.
- **Optional Bitwarden:** Only after selecting `bitwarden`, sign in to Desktop or authenticate the `bw` CLI for its
  separate purpose. Desktop does not authenticate `bw`; never persist `BW_SESSION`.
- **Google Cloud:** Run `mise run cloud:auth` for gcloud and optional `mise run cloud:adc` for local client libraries;
  these are separate credential stores. Use least-privilege identities and do not store service-account JSON here.
- **AI providers:** Sign in through approved provider mechanisms. Use fnox only for task-scoped project secrets; see
  [`examples/fnox.toml`](examples/fnox.toml).

Follow [the credential lifecycle guide](docs/CREDENTIALS.md) for transport selection, socket setup, fnox injection,
status checks, revocation and lost-device response. Configure Git author name/email locally or with `includeIf`; do not
commit identity to this repository.

### Step 9 — Verify the selected workstation

Run the common checks:

```sh
mise run verify:core
mise run macos:brew-check  # macOS only
mise doctor
mise doctor project
mise bootstrap status
mise dot status
mise dot diff
```

Then run checks for selected modules:

```sh
mise run desktop:vscode-check  # desktop selection; app and code CLI
mise run desktop:font-check  # desktop selection; macOS font check
mise run desktop:iterm2-check  # desktop selection; macOS terminal check
mise run ai:check
mise run cloud:python-check
mise run kubernetes:check
mise run supply-chain:check
mise run bitwarden:status  # only when the bitwarden capability is selected
```

Run only applicable tasks. Authentication checks can fail until the corresponding login is complete. A CI dry run does
not prove that GUI, MDM, SSO, SSH agent or cloud access works on a real device.

## Updates and maintenance

Consumers stop after Step 9 and follow the reviewed synchronization workflow. Seed maintainers own version resolution,
lockfile changes, validation and publication. See [Maintenance and updates](docs/MAINTENANCE.md) for the step-by-step
procedures.

## Runtime and platform notes

### Python and uv

- mise installs the workstation Python; projects may select another version in their own `mise.toml`.
- uv manages Python packages and virtual environments. `UV_PYTHON_PREFERENCE=only-system` and
  `UV_PYTHON_DOWNLOADS=manual` prevent a redundant automatic interpreter download.
- In a project, use `uv venv --python "$(mise which python)"`, followed by `uv sync` when `pyproject.toml` exists.

### Google Cloud CLI Python

The workstation Python is mise-managed Python 3.14.10. On macOS, `CLOUDSDK_PYTHON` points to that exact mise install
before gcloud installs, avoiding an invisible `sudo` prompt during bootstrap. Linux does not set this override and uses
the runtime provided by its gcloud backend. Verify the selected runtime with `mise run cloud:python-check`. See
[ADR-006](DECISIONS.md#adr-006--google-cloud-cli-uses-its-supported-python-runtime).

Update mise-managed gcloud through the reviewed lock workflow in
[Maintenance and updates](docs/MAINTENANCE.md#update-mise-managed-tool-versions).
Avoid `gcloud components update`: it updates the local CLI and installed components in place, which can leave the
installation out of sync with mise's recorded version. It does not update cloud resources. See Google's
[component management guide](https://docs.cloud.google.com/sdk/docs/components).

### Managed devices

Employer policy overrides this guide. Use only approved modules, package sources, identities, certificates, VPNs and AI
providers. Do not transfer personal or corporate private keys, PATs, refresh tokens or vault sessions between devices.

## Recovery

Bootstrap is not transactional. Stop after a failure, capture the failing phase, and inspect Git and dotfile state
before retrying. Prefer Git revert for configuration and `mise dot undo` where history exists. Do not delete the global
configuration, tool directories or credentials as a generic repair. Follow [docs/RECOVERY.md](docs/RECOVERY.md).

## Repository maintenance and Agent Skills

This repository contains [AGENTS.md](AGENTS.md) and five project-local maintenance skills cataloged in
[SKILLS.md](SKILLS.md). Compatible coding agents can discover them from `.agents/skills/`; they are not installed as
global user skills and do not grant additional permissions.

Repository-maintenance checks are separate from workstation onboarding. See
[Validation and quality gates](docs/VALIDATION.md) for the pinned Markdown linter and skill checks.

## Repository layout

```text
config.toml                    shared foundation, tasks and diagnostics
miserc.toml                    platform discovery and named capability sets
config.macos.toml             macOS shell setup, Homebrew packages and GNU-first PATH
config.linux.toml             Linux shell setup and apt/dnf prerequisites
config.desktop.toml           optional desktop tools and settings
config.bitwarden.toml         optional Bitwarden CLI/Desktop integration
config.ai.toml                optional AI tools and settings
config.cloud.toml             optional Google Cloud tooling
config.kubernetes.toml        optional Kubernetes/OpenShift/Tekton tooling
config.supply-chain.toml      optional software supply-chain tooling
examples/                     safe local-selection and fnox templates
dotfiles/                     nonsecret Git, VS Code and OpenCode defaults
.agents/skills/               project-local repository-maintenance skills
.github/workflows/            Markdown, skill and configuration validation
docs/                         credentials, security, validation and recovery guidance
```

## Reference documentation

- [mise bootstrap](https://mise.jdx.dev/bootstrap.html)
- [mise modules](https://mise.jdx.dev/bootstrap/modules.html)
- [mise config environments](https://mise.jdx.dev/configuration/environments.html)
- [mise lockfiles](https://mise.jdx.dev/dev-tools/mise-lock.html)
- [mise dotfiles](https://mise.jdx.dev/dotfiles.html)
- [Credential and secret lifecycle](docs/CREDENTIALS.md)
- [Tekton CLI](https://github.com/tektoncd/cli)
- [fnox OS keychain provider](https://fnox.jdx.dev/providers/keychain)
- [Bitwarden fnox provider](https://fnox.jdx.dev/providers/bitwarden)
- [Google Cloud SDK startup](https://docs.cloud.google.com/sdk/gcloud/reference/topic/startup)
- [mise gcloud plugin Python selection](https://github.com/jdx/vfox-gcloud#macos-python)
