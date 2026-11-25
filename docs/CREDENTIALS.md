# Credential and secret lifecycle

This repository installs credential clients and defines explicit login, status and launch tasks. It does **not** store,
sync or automatically retrieve workstation identities during bootstrap. Each credential remains owned by its native
provider or an approved password/identity manager.

Bitwarden is optional. The default fnox example uses the operating-system keychain: macOS Keychain on macOS and a
Secret Service implementation on Linux. An organization-approved hardware agent, password manager or cloud secret
store may be used instead when its lifecycle and policy are understood.

## Ownership matrix

| Purpose | Credential owner | Local delivery | Repository role |
| --- | --- | --- | --- |
| Git over HTTPS and GitHub API | GitHub CLI plus OS credential store | `gh` credential helper | Login/status tasks only |
| Git over SSH and SSH signing | Approved OS, hardware or vault-backed agent | Local SSH agent socket | Read-only diagnostic tasks only |
| gcloud CLI user access | gcloud configuration directory | gcloud refreshes access tokens | Login/status/revoke tasks only |
| Local Google client libraries | Application Default Credentials (ADC) | Local well-known ADC file | Login/status/revoke tasks only |
| Project API tokens | An approved fnox provider | fnox injects selected environment variables into one child process | Provider-neutral examples and explicit launch task |
| CI/CD identity | CI platform, OIDC or workload federation | Short-lived job identity | No workstation secret reuse |

Never commit private keys, access/refresh tokens, `BW_SESSION`, ADC, service-account JSON, kubeconfig credentials or
real fnox values. Do not put them in global mise `[env]`, shell startup, logs or AI context.

## GitHub: choose one Git transport

GitHub CLI/API authentication is separate from the protocol Git uses to clone, fetch and push. Choose HTTPS or SSH per
device; do not configure both merely as fallback.

### HTTPS with browser OAuth

This is the simplest path when an OS credential store and browser OAuth are approved:

```sh
mise run auth:github-https
mise run auth:github-status
```

The first task authenticates GitHub CLI, selects HTTPS and configures Git's GitHub credential helper. GitHub CLI should
store its token in the OS credential store. Check `gh auth status` for the storage location; do not opt into insecure
plain-text storage. A PAT is a fallback only when browser OAuth is unavailable and must not be exported globally.

### SSH with an approved agent

Use this path only after an approved OS, hardware or vault-backed SSH agent is installed:

1. Create a distinct SSH key for the device; do not copy a private key from another machine.
2. Enable the selected agent and choose an authorization policy that requires appropriate user confirmation.
3. Obtain the public key without displaying or exporting the private key.
4. Register the public key with the correct GitHub account or organization and complete required SSO authorization.
5. Confirm the actual agent socket for the selected agent and OS. Configure `SSH_AUTH_SOCK` in a user-owned, per-device
   location; this repository intentionally does not hardcode it.
6. Authenticate GitHub CLI without asking it to generate or upload another key, then run the read-only checks:

```sh
mise run auth:github-ssh
mise run auth:ssh-agent-status
mise run auth:github-ssh-status
mise run auth:github-status
```

`auth:ssh-agent-status` prints public identities exposed by the selected agent. `auth:github-ssh-status` requires
GitHub's host key to be present in `known_hosts` already and will not add or replace it. Establish host trust through an
approved process before running the test.

An SSH agent uses a local socket for listing public identities and signing requests; Git and SSH do not require the
repository to install a private-key file in `~/.ssh`. If Bitwarden is selected, remember that vault synchronization is
not hardware-backed device binding. Accessible SSH items may be available on every device signed into that vault, and
the agent can try multiple keys. Use separately scoped vault access or an approved OS/hardware agent when strict
per-device isolation is required.

### Verify SSH-signed commits locally

Commit signing and local signature verification are separate. When Git uses `gpg.format=ssh`, configure a local
`gpg.ssh.allowedSignersFile` containing the principals and public keys you trust. Keep this trust file out of the
repository: it contains user identities and defines which keys this device trusts.

For a signing key stored as a public-key file, add its current global email and key to the local trust file. Check
whether the file already exists first; append only missing entries and retain old public keys if you need to verify
older commits after key rotation:

```sh
signing_key="$(git config --global --path user.signingkey)"
principal="$(git config --global user.email)"
allowed_signers="$HOME/.config/git/allowed_signers"

test -r "$signing_key"
install -d -m 700 "$HOME/.config/git"
(umask 077; printf '%s %s\n' "$principal" "$(awk 'NR == 1 { print $1, $2 }' "$signing_key")" >> "$allowed_signers")
chmod 600 "$allowed_signers"
git config --global gpg.ssh.allowedSignersFile "$allowed_signers"
```

Run the append only when that principal/key pair is not already present. If `user.signingkey` is not a readable
public-key file, obtain the public key from the approved agent and add the principal/key pair without printing or
copying any private key. Verify a signed commit with `git verify-commit <commit>` or inspect the latest commit with
`git log --show-signature -1`. A key absent from the allowed-signers file will not verify as trusted locally.

Official references: [Bitwarden SSH Agent](https://bitwarden.com/help/ssh-agent/),
[Bitwarden SSH behavior and limitations](https://bitwarden.com/help/about-ssh/), and
[GitHub SSH key registration](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account).

## Google Cloud: CLI login and ADC are separate

Use gcloud's native browser/SSO flow instead of copying an access token from Bitwarden.

### gcloud CLI identity

For interactive commands such as `gcloud projects list`:

```sh
mise run cloud:auth
mise run cloud:auth-status
```

`gcloud auth login` stores refresh credentials in gcloud's per-user configuration directory and refreshes short-lived
access tokens as needed. Do not copy that directory between devices. To revoke a selected gcloud identity, explicitly
approve and run:

```sh
mise run cloud:auth-revoke
```

Deleting local files alone is not a substitute for provider-side revocation.

### Application Default Credentials

ADC is for local applications and Google client libraries; it does not authenticate the gcloud CLI itself:

```sh
mise run cloud:adc
mise run cloud:adc-status
```

On macOS and Linux, user ADC is normally stored at
`~/.config/gcloud/application_default_credentials.json`. `cloud:adc-status` verifies that ADC can mint a token but
discards the token instead of printing it. When local development no longer needs ADC, explicitly approve and run:

```sh
mise run cloud:adc-revoke
```

The revoke command invalidates credentials created by `gcloud auth application-default login` and deletes their local
credential file. It does not affect workload-federation files, attached service accounts or other credential sources.

For automation and production, prefer attached identities, Workload Identity Federation, Workforce Identity Federation
or approved service-account impersonation. Avoid long-lived service-account keys. Do not place gcloud access tokens or
ADC JSON into Bitwarden merely to replicate them between machines.

Official references: [gcloud authentication](https://docs.cloud.google.com/sdk/docs/authenticate),
[Application Default Credentials](https://docs.cloud.google.com/docs/authentication/application-default-credentials),
and [ADC revocation](https://docs.cloud.google.com/sdk/gcloud/reference/auth/application-default/revoke).

## fnox project secrets without Bitwarden

fnox is a provider adapter and process-scoped injector. The default example uses the operating-system keychain and sets
`env = "exec"`, so configured values are injected only into a child process launched with `fnox exec`.

```sh
cd /path/to/project
cp ~/.config/mise/examples/fnox.toml ./fnox.toml
fnox set SERVICE_API_TOKEN --provider keychain
fnox exec -- your-command
```

`fnox set` prompts for the value and writes it to macOS Keychain or the Linux Secret Service; it does not place the
value in `fnox.toml`. The checked-in example contains only the provider name and secret identifier. A project may commit
such reference-only configuration when those identifiers are acceptable metadata, or ignore the file when they are
sensitive. Never commit a resolved secret. A headless Linux host may not have a usable Secret Service; use an approved
encrypted-file or cloud provider there instead of adding a desktop keyring solely for this repository.

For OpenCode, copy `examples/fnox.opencode.toml` to the target project's `fnox.toml`, set `OPENAI_API_KEY` through the
keychain provider, and explicitly run:

```sh
mise run ai:opencode-with-secrets
```

An AI process receiving an API key can use or disclose it. Prefer provider sign-in when supported and inject only the
minimum required secret.

Other fnox providers include encrypted local age files, organization password managers and cloud secret stores:

| Provider approach | Suitable when | Main consideration |
| --- | --- | --- |
| OS keychain (default example) | Interactive macOS/Linux desktop | Linux requires a Secret Service implementation |
| Encrypted age file | Offline or headless use is required | Protect and recover the age identity separately |
| Organization vault or cloud store | Central policy, audit or workload identity is required | Follow provider login and least-privilege policy |

Choose deliberately based on device portability, offline access, organization policy and revocation needs. Do not add
a provider credential to global mise environment variables merely to make fnox automatic.

### Optional Bitwarden provider

Select the `bitwarden` mise capability explicitly and copy `examples/fnox.bitwarden.toml` only when Bitwarden is the
approved provider. Bitwarden Desktop, the `bw` CLI and fnox have independent sessions; Desktop unlock does not unlock
`bw`. Authenticate `bw` in a dedicated shell and keep the session short-lived:

```sh
bw login
export BW_SESSION="$(bw unlock --raw)"
mise run bitwarden:status
fnox provider test bitwarden
fnox exec -- your-command
unset BW_SESSION
bw lock
```

Do not print `BW_SESSION`, enable shell tracing or run this sequence in a captured CI log. Every child process launched
from the unlocked shell can inherit the session. Every process launched by `fnox exec` can read the injected project
secrets.

Official references: [fnox keychain provider](https://fnox.jdx.dev/providers/keychain),
[fnox provider catalog](https://fnox.jdx.dev/providers/overview), [Bitwarden CLI](https://bitwarden.com/help/cli/) and
[fnox Bitwarden provider](https://fnox.jdx.dev/providers/bitwarden).

## CI, servers and non-interactive workloads

Do not reuse a workstation's GitHub OAuth token, Bitwarden session, gcloud user credential or ADC in CI. Prefer:

- the CI platform's repository-scoped ephemeral GitHub token;
- OIDC/workload identity federation for cloud providers;
- attached service accounts on cloud resources;
- a CI-managed secret only when no short-lived identity mechanism exists.

Headless systems should not receive a human vault session merely to load mise configuration. The global configuration
must parse and its non-authentication diagnostics must run without Bitwarden or cloud login.

## Lost device, offboarding or suspected compromise

Revoke remotely before relying on local cleanup:

1. **GitHub SSH:** Remove the device's public key from GitHub and organization SSO authorization. Rotate any key that
   may have been copied or exposed.
2. **GitHub CLI:** Revoke the GitHub CLI OAuth authorization when compromise is suspected; local `gh auth logout` alone
   removes local configuration but does not necessarily revoke the remote OAuth grant.
3. **Bitwarden:** Deauthorize sessions from the web vault, review devices, change the master password when appropriate,
   and rotate exposed vault items. Remove the lost device's SSH key from every relying service.
4. **Google Cloud:** Revoke gcloud identities and ADC, remove suspicious connected-app access, invalidate exposed keys,
   and involve the cloud/identity administrator for managed accounts.
5. **Local machine:** Only after remote revocation, remove cached credentials through the provider's supported logout or
   revoke command. Do not delete broad configuration directories as a generic response.

Record which identity was revoked, affected accounts/projects and follow-up rotation work without recording credential
values. See [recovery guidance](RECOVERY.md) for configuration rollback; credential revocation is a separate process.

Official references: [Bitwarden device management](https://bitwarden.com/help/manage-devices/),
[GitHub CLI logout and remote revocation](https://cli.github.com/manual/gh_auth_logout), and
[Google credential compromise response](https://docs.cloud.google.com/docs/security/compromised-credentials).
