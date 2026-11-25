---
name: mise-module-authoring
description: Use when adding or changing mise-workstation tools, packages, tasks, dotfiles or diagnostics.
---

# Authoring mise modules

## Principles

- Read [architecture](../../../ARCHITECTURE.md), [decisions](../../../DECISIONS.md), and
  [AGENTS.md](../../../AGENTS.md).
- Prefer native mise configuration. Add code only when `[tools]`, packages, tasks, dotfiles, wrappers and diagnostics
  cannot express the requirement.
- Preserve `config.toml` as a credential-free, small CLI foundation. Put optional software in an existing capability
  (`desktop`, `ai`, `cloud`, `kubernetes`, `supply-chain`, `bitwarden`) unless a distinct lifecycle justifies another.
- Support macOS/Linux explicitly; OS-specific system packages belong in appropriate platform/module declarations. Don't
  assume GUI packages are available on headless Linux.
- Pin important runtimes, document justified `latest` usage, and avoid committing guessed `mise.lock` entries.
- Preserve project `auto_install = false`. Tasks and diagnostics must fail clearly when their prerequisites are absent;
  document an explicit bootstrap or `mise install` command instead of relying on task-time installation.
- Never add secrets, work/personal identity details, or cloud tokens to TOML or dotfiles.
- On macOS, keep the repository-owned `~/.zshrc` surface limited to the mise activation block and the bridge declared
  in `config.macos.toml`. Preserve untracked `~/.zshrc.local`; never absorb its device-specific contents into Git.
- Declare shared Apple Silicon formulae with native `brew:` packages in `config.macos.toml`. Preserve the reviewed
  GNU-first macOS PATH, including formula `gnubin`, `gnu-getopt`, GNU binutils and OpenSSL CLI paths. Do not add global
  compiler/linker flags for keg-only libraries without a separate reviewed requirement.

## Workflow

1. Identify the correct `config.<capability>.toml` and check existing patterns before changing syntax.
2. Verify that the proposed mise feature and backend exist in the target version, especially for bootstrap packages,
   module selection, wrappers and dotfile merge semantics.
3. Make the smallest declarative edit. Preserve existing user settings and the Linux/macos separation.
4. Update `README.md` for changed user-facing behavior; add an ADR if changing an architectural commitment.
5. Validate `mise config ls`, `mise tasks validate`, and the relevant
   `mise -E <modules> bootstrap --dry-run --skip task` preview **when mise is available**.
6. Run `mise run verify:docs` if Markdown changed, or `mise run verify:skills` if skill/catalog files changed. Inspect
   `mise dot diff` before applying any dotfile change.
7. Report the planned install/update/removal effect; request approval before any real bootstrap, upgrade, Git push or
   system modification.

## Avoid

No new top-level Bash installer, secrets in global `[env]`, unconditional native package installation, or silent
deletion of previously installed tools.
