# DECISIONS — mise-workstation v5

This file records the implementation baseline. Change decisions through a reviewed Git PR and document the tradeoff,
not through opaque bootstrap logic.

## ADR-001 — mise-native global configuration

**Decision:** Keep the reviewed `https://github.com/spuranam/bootstrap` repository or an approved mirror as the source
of truth. Populate `~/.config/mise` either by direct Git clone or by a reviewed one-way rsync from a local checkout.
`mise bootstrap --adopt` is not needed after either method. **Rationale:** A single versioned seed provides provenance
while mise manages host packages, dotfiles, runtimes, tasks and activation. **Alternatives:** Getting Started ZIP,
custom Bash/Go installer, Ansible, Nix-Darwin. **Tradeoff:** Direct clone keeps history in the active config. Rsync
copies only files and does not advance Git history, so updates and lock maintenance must use the source checkout. The
destination may retain its own `.git` metadata, but it is not the update source. Initial Git trust and authentication
for a private repository may require a narrow pre-bootstrap GitHub CLI invocation; bootstrap remains neither fully
unattended nor transactional.

## ADR-002 — macOS and Linux only in v5

**Decision:** Target macOS ARM64, Ubuntu LTS and Fedora. Include automatic platform config selection via `miserc.toml`
with `auto_env = true`. **Rationale:** Prioritize machines currently needed; eliminate native Windows shell/package
complexity. **Deferred:** Windows PowerShell and WSL2, including their separate identities and package managers.

## ADR-003 — Capabilities rather than personal/work profiles

**Decision:** Global foundation plus `desktop`, `ai`, `cloud`, `kubernetes`, `supply-chain` and an independently
selected `bitwarden` integration. Credential-provider modules are excluded from the `dev`, `platform` and `full`
convenience sets. Per-device `miserc.local.toml` is untracked. **Rationale:** Identical capabilities often span personal,
corporate and home-lab machines, while credential providers are policy-sensitive. Device ownership belongs in identity/policy
rather than software configuration. **Exception:** Add a policy module only if an employer mandates distinctly approved
applications or security configuration.

## ADR-004 — Credential-provider and native identity boundaries

**Decision:** Use an approved OS, hardware or vault-backed SSH agent with unique keys per device, GH OAuth/credential
helper, and gcloud OAuth/ADC. Use fnox with an approved provider for narrowly scoped **project** secrets only; the
portable default is the OS keychain and Bitwarden remains an explicit option. **Rationale:** No
configuration-decryption chicken-and-egg; no PAT, long-lived token, `BW_SESSION` or SSH private key in global mise env.
**Tradeoff:** First login, SSO and per-device SSH authorization require human interaction. When selected, Bitwarden
Desktop and `bw` do not share a session. Bitwarden vault synchronization is not hardware-backed device binding and its
SSH agent can expose multiple accessible vault keys; environments requiring strict device isolation must use an
approved OS, hardware or separately scoped agent.

## ADR-005 — mise Python, uv for packages and environments

**Decision:** Mise installs Python 3.14.10, uv 0.13.9. `UV_PYTHON_PREFERENCE = only-system`;
`UV_PYTHON_DOWNLOADS = manual`. Projects can override mise Python. **Rationale:** Avoid duplicate Python managers and
make Python selection explicit. **Tradeoff:** uv will not auto-provision a missing Python. Install it through mise
first.

## ADR-006 — Google Cloud CLI uses its supported Python runtime

**Decision:** Install `gcloud` via mise and pin workstation Python to `3.14.10`. On macOS, set `CLOUDSDK_PYTHON` to
that exact mise-managed interpreter before installing gcloud. Do not set this override on Linux; retain the runtime
supplied by its gcloud backend. **Rationale:** The mise vfox backend suppresses gcloud's interactive/sudo Python
provisioning during tool installation. The workstation's pinned interpreter matches gcloud's required minor, avoiding
that prompt. **Validation:** Check the selected runtime with
`gcloud info --format='value(basic.python_location)'` and `mise run cloud:python-check`; review changes to gcloud's
required Python minor before changing this policy.

## ADR-007 — Declarative native resources; minimal shell

**Decision:** Use native `[tools]`, `[bootstrap.packages]`, `[dotfiles]`, `[wrappers]`, `[doctor.checks]` and TOML
tasks. No generic Bash installer and no Python scripts in CI. **Rationale:** Better readability and portability; simpler
diffs and isolated failures. **Tradeoff:** A few first-time OS package commands and small `mise run` task commands are
still necessary.

## ADR-008 — No destructive dotfile replacement by default

**Decision:** Merge Git/OpenCode defaults into existing files when keys are absent; seed VS Code settings only when
missing. Keep portable Git defaults in the foundation and seed VS Code Git editor/diff/merge settings only with the
optional `desktop` capability. Keep Git author identity and signing keys user/device-owned. On macOS, manage a regular
`~/.zshrc` only through the mise activation block and a bridge to untracked
`~/.zshrc.local`; never commit the local shell body. Always inspect `mise dot diff`.
**Rationale:** Preserve existing workstation configuration and app-managed settings without making bootstrap depend on
machine- or organization-specific shell content. **Tradeoff:** A legacy symlinked `~/.zshrc` requires a reviewed,
recoverable one-time migration, and upgrading defaults may not overwrite keys the user already set.

## ADR-009 — Version policy and honest lockfile status

**Decision:** Pin validated core versions in TOML. Before the first bootstrap, resolve every capability with
`mise lock --global`, review the generated entries for supported macOS/Linux platforms, test a locked installation, then
commit the lockfiles and sidecars. Consumers must apply with locked mode and must not bump versions during routine
synchronization. No invented lock metadata. **Rationale:** TOML requests define the update channel; generated locks hold
the exact resolution and backend/platform-specific artifact metadata. **Limitation:** apt/dnf repositories, Homebrew
casks, GUI authorization and backends without complete artifact metadata are not byte-for-byte reproducible. CI
validates config/dry runs but does not replace representative real-device locked-install testing.

The optional Bitwarden CLI uses the npm backend as a pinned `@bitwarden/cli` package. Commit its generated dependency
sidecar with the lockfiles so strict locked installation can reproduce its dependency graph.

## ADR-010 — CI previews, real-machine integration separately

**Decision:** GitHub Actions validates Markdown and Agent Skills, then runs a macOS/Ubuntu/Fedora matrix for mise config
parsing, task validation and bootstrap dry runs. No secrets in CI. **Rationale:** Catches documentation,
OS/config/module errors early, but does not claim Apple authorization, Bitwarden Desktop, gcloud OAuth or GUI/MDM
success. **Deferred:** Dedicated disposable VM/host E2E test harness and full GUI integration test suite.

## ADR-011 — Secure-by-default updates and rollback

**Decision:** Always preview a bootstrap/update. Update a Git-backed active config by reviewed fast-forward; update an
rsync-managed active config from a reviewed source checkout using the non-deleting rsync procedure. Never bulk replace
unrelated files or automatically remove dropped packages. Prefer `mise dot undo` when history exists and restore a
known-good reviewed seed for config regressions. **Rationale:** Bootstrap executes untrusted code if repo review is
skipped and is not transactional. **Deferred:** Automated package pruning, system modification rollback and remote
device updates.

## ADR-012 — AI is optional, approvals don't equal sandboxing

**Decision:** Herdr CLI, OpenCode/fnox and conservative nonsecret settings are in `ai`. Provider accounts and MCP
integrations are selected and authenticated separately; no provider token in repo. **Rationale:** Align human approval
with explicit capability selection. **Deferred:** Preconfigured remote MCP servers, autonomous AI agent privileges,
native OS sandboxing and enterprise AI policy management.

## ADR-013 — Project-local Agent Skills, not global workstation authority

**Decision:** Add root `AGENTS.md`, a human-facing `SKILLS.md` catalog, and five focused
`.agents/skills/<name>/SKILL.md` definitions. Skills are **project-local** and do not bootstrap into `~/.agents/skills`
automatically. **Rationale:** Use the cross-agent Agent Skills format and make v5 maintainable by AI assistants without
globally distributing administrator-oriented guidance. **Validation:** Use pinned markdownlint plus a minimal Node.js
metadata/catalog validator in CI. The metadata validator discovers every skill directory while preserving the five
required baseline skills; optionally run a standard skills reference validator independently. No skill execution in CI.
**Security:** Skill instructions are content from a repository, not trusted OS policy. Agents may suggest changes, but
installation, authentication, cloud mutations, destructive actions and Git pushes need explicit user approval.
**Deferred:** Automatic global skill deployment, third-party skill imports, proactive `mise skills sync`, remote MCP
configuration and always-on autonomous agents. Tool-shipped skills can be examined with `mise skills ls` and synced
explicitly later.

## ADR-014 — GNU-first macOS command environment

**Decision:** On Apple Silicon, declare common build/userland formulae through mise's native `brew:` package manager and
put their `gnubin` directories before macOS system paths. Also prefer Homebrew `gnu-getopt`, keg-only GNU `binutils` and
the `openssl@3` CLI. Keep macOS `/bin/zsh`; do not add global compiler/linker flags for keg-only libraries.
**Rationale:** GNU command semantics are an intentional part of this workstation's reproducible mise-managed contract,
not a per-project exception or an accidental local-shell customization. **Tradeoff:** Unqualified commands such as
`sed`, `find`, `awk`, `make`, `tar`, `ls`, `date`, `strip` and `openssl` can behave differently from a stock Mac.
Scripts meant for unmanaged macOS must test their dependencies or use explicit paths. Brew formula versions remain
rolling package-manager state and are reviewed/upgraded separately from mise tool lockfiles.

## ADR-015 — Disable implicit mise tool installation

**Decision:** Set project `auto_install = false`. Tasks, `mise exec` and command-not-found handling may use installed
tools but may not install missing tools implicitly. Software installation remains an explicit bootstrap or `mise
install` operation after review; CI explicitly installs its pinned task-only linter. **Rationale:** Read-only checks
must not acquire runtimes as a side effect, and the command that changes workstation state should be obvious in review
and terminal history. **Tradeoff:** A task can fail until its declared tools are provisioned. This is intentional; the
README and validation guide identify the required bootstrap or explicit maintenance install.
