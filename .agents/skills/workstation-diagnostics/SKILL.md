---
name: workstation-diagnostics
description: Use for mise-workstation config, package, dotfile, auth or runtime failures on macOS/Linux.
---

# Workstation diagnostics

## Diagnose before modifying

- Read [validation](../../../docs/VALIDATION.md), [recovery](../../../docs/RECOVERY.md), and
  [AGENTS.md](../../../AGENTS.md).
- Start with the effective OS, selected local modules, mise version and exact error. Do not delete existing mise data,
  dotfiles, Git checkout or SSH keys to "reset" the machine.
- Avoid posting paths or logs that include tokens, private keys, vault contents, exported secrets or corporate-only
  identifiers.

## Read-only workflow

1. Inspect `mise --version`, `mise config ls`, `mise tasks validate`, `mise bootstrap status`, and selected module
   configuration.
2. Compare tool resolution using `mise which <tool>` and installed versions; check `mise doctor` and
   `mise doctor project` where available.
3. Inspect `mise dot status` and `mise dot diff` for proposed changes to user-owned settings.
4. Run `node tools/validate-skills.mjs` if failure involves agent skill discovery or metadata.
5. Use `mise -E <modules> bootstrap --dry-run --skip task` to preview a proposed repair without installing or removing
   anything.
6. Diagnose credential access through **status-only** checks (`gh auth status`, `bw status`, relevant gcloud status
   commands); never dump secret content.
7. For Cloud SDK Python failures, inspect the real interpreter and backend as described in
   [cloud-development](../cloud-development/SKILL.md).
8. If a repair changes repository Markdown or skills, run `mise run verify:skills` before reporting completion.

## Repairs and rollback

Present the smallest proposed fix, its likely impact, and a rollback path; obtain explicit approval before applying. For
configuration regressions prefer a reviewed Git revert. For dotfile changes use mise-managed history/undo only after
inspection. Bootstrap and package installs are not transactional.

## Output

Distinguish confirmed findings, suspected causes, next checks, and changes actually applied. Report untested platform
assumptions instead of inventing success.
