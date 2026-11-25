---
name: credential-setup
description: Use for per-device SSH/GitHub auth, Bitwarden, fnox provider setup or AI tool secrets.
---

# Credential setup

## Security constraints

- Read the [credential lifecycle](../../../docs/CREDENTIALS.md), [security policy](../../../docs/SECURITY.md) and
  [ADR-004](../../../DECISIONS.md#adr-004--credential-provider-and-native-identity-boundaries).
- Use only approved credential providers. When using SSH, require a **distinct key per device**; never copy private keys
  or refresh tokens from other machines. Do not assume Bitwarden is available.
- Never ask the user to paste secrets, print vault contents, echo `BW_SESSION`, or save API keys in `config.toml`,
  `.env` committed to Git, agent context, or CI logs.
- An SSH agent, a provider CLI, and fnox have distinct authentication/session lifecycles. If Bitwarden is selected, do
  not assume Desktop unlock gives a `bw` CLI session.
- Never silently authenticate or enroll a device. User-driven approval remains required for browser/SSO prompts and
  credential access.

## Workflow

1. Determine which purpose is needed: Git clone, SSH signing, GitHub API, cloud login, or per-task model-provider key.
2. For SSH, use an approved OS, hardware or vault-backed agent. Confirm the actual agent socket for the OS/installation;
   do not hardcode a provider-specific macOS socket on Linux. Use `mise run auth:ssh-agent-status` and
   `mise run auth:github-ssh-status`. If Bitwarden is selected, do not mistake vault sync for hardware-backed device
   isolation.
3. Choose one GitHub transport path: `auth:github-https` for the OS credential helper or `auth:github-ssh` after the
   public SSH key is registered. Check with `auth:github-status`; use a narrowly scoped PAT only when OAuth is not
   viable, without exporting it globally.
4. For fnox, choose the provider explicitly. Default to the OS keychain example in
   [examples/fnox.toml](../../../examples/fnox.toml); use `examples/fnox.bitwarden.toml` only when the separately
   selected Bitwarden capability is approved. Secrets are injected into a specific process, not automatically into
   every shell.
5. Identify the process that will receive each secret; warn that an AI agent receiving the secret can use or leak it,
   and obtain authorization before running it.
6. Verify status without displaying credential values. Clean up temporary CLI sessions when done.
7. For device loss or offboarding, follow the credential guide's provider-side revocation order; deleting a local file
   alone does not necessarily revoke the remote credential.
8. If the workflow changes repository Markdown or skills, run `mise run verify:skills` before reporting completion.

## Completion report

Report which identities were configured, which checks succeeded, any corporate-policy blockers, and any remaining
user-controlled authentication actions. Never report secret values.
