# Validation and quality gates

Use these checks to review repository changes. They do not prove that a workstation installed or works correctly.

For commands run from a checkout outside the active mise config directory, set `MISE_CONFIG_DIR="$PWD"`. Omit the
prefix when the checkout is `~/.config/mise`.

## Markdown and Agent Skills

The Markdown linter is pinned as a task-only dependency. Install it explicitly once after mise and Node.js are
available; it is not part of workstation bootstrap:

```sh
MISE_CONFIG_DIR="$PWD" mise install npm:markdownlint-cli@0.47.0
```

After Markdown changes, lint every Markdown file, including hidden project skills:

```sh
MISE_CONFIG_DIR="$PWD" mise run verify:docs
```

After changing `AGENTS.md`, `SKILLS.md` or `.agents/skills/`, run the combined check. It lints Markdown first, then
checks the skill directories, required frontmatter, catalog entries and documentation links:

```sh
MISE_CONFIG_DIR="$PWD" mise run verify:skills
```

When the linter cannot be installed, `node tools/validate-skills.mjs` provides an offline metadata and link check only;
it does not replace Markdown lint. For a full Agent Skills format check, run an independently installed
`skills-ref validate .agents/skills/<name>` for each skill.

## Mise configuration checks

Run these on a supported macOS or Linux system with mise installed:

```sh
MISE_CONFIG_DIR="$PWD" mise config ls
MISE_CONFIG_DIR="$PWD" mise tasks validate
MISE_CONFIG_DIR="$PWD" mise -E full bootstrap --dry-run --skip task
MISE_CONFIG_DIR="$PWD" mise bootstrap status
MISE_CONFIG_DIR="$PWD" mise doctor
MISE_CONFIG_DIR="$PWD" mise doctor project
```

The config and task commands check parsing. The bootstrap dry run previews declarative changes without applying them;
`--skip task` avoids running the post-bootstrap task. `mise doctor project` may report missing tools before bootstrap;
run it after the selected tools have been installed.

## CI coverage

CI runs the Markdown and skill checks, then parses mise configuration and previews selected capability combinations on
macOS, Ubuntu and Fedora. It installs the pinned documentation tools and minimum Fedora container prerequisites, but
does not run a non-dry-run workstation bootstrap, sign in to credential providers, install GUI apps or exercise live
cloud access.

## Real-device acceptance

Before declaring a platform ready, validate it on a fresh or disposable device. Record the OS version, architecture,
mise version, selected capabilities, lockfile revision, bootstrap result and applicable README Step 9 checks. Never
record identity values, tokens, private keys or credential paths.

1. **macOS Apple Silicon:** Apply the reviewed locked bootstrap, open a fresh login shell, and run
   `mise run macos:brew-check`. Confirm unprefixed GNU commands and Homebrew developer CLIs resolve under
   `/opt/homebrew`.
2. **Ubuntu and Fedora:** Apply the same reviewed configuration with the expected package manager. Validate the CLI-only
   foundation without requiring a GUI.
3. **Rerun:** Confirm user files are preserved and `mise dot diff` is understandable.
4. **Python and uv:** `uv python list --only-installed` shows the mise-installed interpreter; uv does not download a
   second Python.
5. **gcloud:** On macOS, `mise run cloud:python-check` shows workstation Python 3.14.10 for both Python and gcloud. On
   Linux, confirm `CLOUDSDK_PYTHON` is unset and gcloud uses its backend-provided runtime.
6. **Locks:** Before the first consumer bootstrap, a seed maintainer has generated and reviewed locks for supported
   platforms, tested a locked installation and committed the lockfiles and dependency sidecars.

This repository has no recorded clean-device installation result. CI parsing and dry runs on an already configured
machine do not satisfy the real-device acceptance criteria.
