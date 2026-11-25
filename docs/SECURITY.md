# Security model

## Trust boundaries

- A mise config is executable code: review Git commits and bootstrap dry runs.
- Global config MUST load without a Bitwarden unlock or cloud login.
- Never store private keys, OAuth refresh tokens, `BW_SESSION`, GitHub PATs, or service account JSON here.
- Keep Git's SSH `allowed_signers` trust file and user-specific signing identities in the local user configuration, not
  in this repository.
- Never export an AI API key in `[env]` globally. Use per-project fnox secret injection or provider sign-in.
- SSH key registration/agent enrollment is a per-device action; do not copy personal private keys to work machines.
- Work device policy, SSO, and package approvals always take precedence.
- Credential providers are opt-in; selecting `desktop`, `dev` or `full` does not require Bitwarden.
- When Bitwarden is selected, Desktop and the `bw` CLI are distinct processes. Desktop vault unlock does not
  authenticate the CLI.

See [credential and secret lifecycle](CREDENTIALS.md) for GitHub HTTPS/SSH selection, gcloud versus ADC, fnox process
injection, verification and provider-side revocation.

## AI risk

`opencode` permission prompts are advisory application controls, not a secure OS sandbox. Review remote MCP servers,
repo instructions, agent skills, and executable tasks before enabling them. Keep agent integrations off by default.

## Repository agent skills

- `AGENTS.md` is repository guidance, not an authorization boundary; individual agents still execute with their own
  granted permissions.
- Review edits to `.agents/skills/*/SKILL.md` as executable workflow instructions: malicious text can attempt prompt
  injection, request credentials or run unsafe commands.
- v5 does **not** install these five maintenance skills globally, auto-sync third-party skills, or auto-enable MCP
  integrations. Do not turn on global skill sync without reviewing the source and permissions.
- Skill files must never embed tokens, example _real_ credentials, `BW_SESSION`, SSH private keys or instructions to
  bypass device/corporate approval.
- Agent usage of `mise bootstrap` and cloud or Git mutations requires explicit human approval; a dry run is not evidence
  that an apply is risk-free.

## Supply chain

- After lockfiles exist, review `MISE_LOCKED=1 mise bootstrap --dry-run` and `mise dot diff` before apply.
- Pin tool versions and commit a generated platform-aware lockfile when online (`mise lock --global`).
- Restrict CI credentials: this repository's validation workflow uses no cloud or Bitwarden secrets.
- Never run `mise bootstrap` as root; apt/dnf can request sudo only for packages.
