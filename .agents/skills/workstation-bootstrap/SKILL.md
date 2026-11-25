---
name: workstation-bootstrap
description: Use for first-device setup, adoption, updates or reprovisioning of macOS/Linux workstations.
---

# Workstation bootstrap

## Before starting

- Read the repository [README](../../../README.md), [architecture](../../../ARCHITECTURE.md) and
  [security guide](../../../docs/SECURITY.md).
- Identify the device OS/distro, whether it is managed by an employer, the desired capabilities, and whether
  mise/Git/authentication are already present.
- Explain upfront that macOS approval prompts, selected credential-provider unlock, GitHub/Google OAuth and policy
  enrollment may require human intervention.
- Do **not** require Bitwarden CLI or any secret-provider session merely to load the base config.

## Workflow

1. Confirm device trust and baseline prerequisites from README **Step 1** (Git, TLS, installer provenance). Do not run
   the whole flow as root.
2. Follow README **Step 3** on every machine: establish GitHub credentials only when required, then clone and review the
   canonical `https://github.com/spuranam/bootstrap` seed or use the documented one-way rsync from a reviewed local
   checkout. Verify source provenance and preview rsync changes before copying. Never replace a nonempty global
   configuration directory silently; rsync does not preserve Git history or install tools.
3. Keep module selections local as described in README **Step 4**. Use `mise -E ...` for one-off selection and ignored
   `miserc.local.toml` for the saved device choice. Credential providers such as `bitwarden` remain explicit and are not
   implied by `dev` or `full`. Do not add a personal/work software profile.
4. Complete README **Step 5** before provisioning: the seed maintainer generates and reviews locks; consumers require
   the committed locks and must not bump them during routine setup.
5. Show a strict locked plan using `MISE_LOCKED=1 mise bootstrap --dry-run` with the requested modules; also inspect
   `mise dot diff` for existing files. On macOS, detect a symlinked `~/.zshrc`; do not force through it. Follow the
   README's reviewed migration so the original target remains available for rollback and local content stays untracked.
6. **Obtain approval before applying** the exact previewed plan in README **Step 7**. Never remove locked mode merely to
   bypass missing lock coverage.
7. After provisioning, direct the user through approved, interactive identity setup from README **Step 8**. Do not
   capture raw tokens or keys.
8. Validate the README **Step 9** common checks and applicable module checks. Note which checks require real GUI/SSO
   access.
9. For seed maintenance, follow [Maintenance and updates](../../../docs/MAINTENANCE.md): verify the source, review the
   complete staged diff for secrets, and require explicit approval before pushing.
10. If the workflow changes repository Markdown or skills, run `mise run verify:skills` before reporting completion.

## Completion report

Summarize selected capabilities, what was applied vs previewed, identity steps still requiring the user, actual
validation outcomes, and links to [recovery](../../../docs/RECOVERY.md). Never claim first-boot testing succeeded merely
because CI parsing passed.
