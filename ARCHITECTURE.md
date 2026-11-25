# ARCHITECTURE — mise-workstation v5

## Mission

Create a portable, version-controlled developer workstation on macOS and Linux that is **declarative by default**,
applies safely to multiple devices, and is approachable to maintain. The platform enables Go, Python/uv, Node.js, VS
Code, OpenCode, cloud tooling, Kubernetes/OpenShift/Tekton and secure software supply-chain utilities without cloning
device credentials.

## Principles

1. **One engine:** mise owns runtime selection, package bootstrap, shell activation, dotfile deployment, tasks and
   diagnostics.
2. **No monolithic installer:** Initial operating-system and Git trust are explicit. Any scripts are tiny, isolated, and
   justified.
3. **Composable capabilities:** Core plus `desktop`, `ai`, `cloud`, `kubernetes`, `supply-chain`, and an independently
   selected `bitwarden` integration. No hardcoded work/personal software profiles.
4. **OS-specific behavior is explicit:** `auto_env=true` selects `config.macos.toml` / `config.linux.toml`. Linux
   apt/dnf manager support is native.
5. **Local identity:** SSH agents and GH/gcloud OAuth are per-device; project secrets use an approved fnox provider on
   demand, never global `[env]` secrets. Bitwarden is optional.
6. **Least surprise:** Dry-run before apply; safe dotfile edit/seed patterns; no automatic repository creation,
   implicit tool installation, destructive cleanup, or self-elevation.
7. **Explicit version discipline:** Resolve and review pins, test locked installation, then commit mise-generated
   lockfiles. Don't commit guessed download metadata.
8. **Evidence over promises:** CI checks config loading/dry runs. Native GUI/SSO integrations require real-device
   validation.

## Configuration processing

```text
                    Reviewed seed checkout (Git source)
                                      |
                           clone or reviewed rsync
                                      |
                       ~/.config/mise (active config)
                                      |
          +---------------------------+------------------------+
          |                           |                        |
      config.toml                 miserc.toml          miserc.local.toml
       foundation           auto_env + env_sets      private, ignored
          |                           |                        |
          |                  +--------+-------+          opt-in modules
          |                  |                |                |
          |            config.macos     config.linux       config.<x>
          |                  |                |          (desktop, ai, ...)
          +------------------+----------------+----------------+
                                     |
                               mise bootstrap
                                     |
                  packages -> dotfiles -> shell -> tools -> task
                                     |
                     doctor, validation and reviewed update
```

`miserc.local.toml` lists capability environments; `mise -E` overrides the list for one invocation, and `--save-env`
saves a choice locally. Never commit the selection as a global policy or couple it to device ownership.

## Component responsibilities

| Component                  | Owned concerns                                                          | Explicit exclusions                                 |
| -------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| `config.toml`              | Core versions, explicit-install policy, Git defaults and checks         | Secrets, corporate identity, GUI apps               |
| `miserc.toml`              | Platform discovery and named module sets                                | Credentials, package installations                  |
| `config.macos.toml`        | Formulae, GNU-first PATH and zsh activation                             | Local shell body, global compiler/linker flags      |
| `config.linux.toml`        | bash shell activation, apt/dnf prerequisites                            | GUI package repos not uniformly present             |
| `config.desktop.toml`      | VS Code, Ghostty, iTerm2, Go Mono Nerd Font, VS Code Git tools          | Credential-provider installation                    |
| `config.bitwarden.toml`    | Optional Bitwarden CLI/desktop integration                              | Login, sessions or private-key export               |
| `config.ai.toml`           | Herdr TUI, OpenCode/fnox tools and conservative local policies          | AI provider tokens, MCP auto-authorization          |
| `config.cloud.toml`        | gcloud tool and auth/verification tasks                                 | Cloning ADC/OAuth credentials                       |
| `config.kubernetes.toml`   | kubectl, `oc`, Helm, Tekton CLI, k9s                                    | Live cluster credentials                            |
| `config.supply-chain.toml` | Cosign, SBOM and vulnerability tools                                    | Signing keys, public/private registry passwords     |
| `dotfiles/`                | Non-secret defaults through mise edits / create-if-missing              | User-owned files unless explicitly selected         |
| Approved secret provider   | Passwords and signing keys outside Git                                  | Runtime/tool installation by implicit selection     |
| GitHub/gcloud native auth  | Per-device OAuth, credential-helper and ADC state                       | Cross-device credential synchronization             |
| fnox                       | Per-task project secret injection                                       | Global shell secrets, unattended bootstrap          |
| GitHub Actions             | Markdown/skill lint plus config validation on macOS/Ubuntu/Fedora       | Corporate SSO and real GUI/SSH testing              |

## AI agent instructions and Agent Skills

- [`AGENTS.md`](AGENTS.md) contains short, repository-wide rules for agent-assisted maintenance: mise-first changes, OS
  scope, approval gates, validation, and security.
- [`SKILLS.md`](SKILLS.md) is a **human-readable index**, not a skill discovered by its filename.
- [`.agents/skills/`](.agents/skills/) contains five project-local, on-demand `SKILL.md` workflows: workstation
  bootstrap, module authoring, credentials, cloud development, and diagnostics. They follow the Agent Skills format with
  `name` and `description` frontmatter.
- The skills maintain **this repository**, and are **not deployed as global developer skills**. AI agent tools must not
  load them as authority for unrelated projects. The optional `ai` module continues to install OpenCode/fnox, but does
  not auto-enable MCP servers or sync third-party skills.
- A pinned `markdownlint-cli` task checks every Markdown file, including hidden `.agents/` content. A minimal offline
  validator (`node tools/validate-skills.mjs`) checks conventions and catalog links. `mise run verify:skills` runs both
  in CI. The local metadata validator is not a replacement for an optional external spec validator such as
  `skills-ref`.
- Future user-wide development skills (Go, OpenShift, Tekton, supply chain) require independent review and explicit
  opt-in; they are separate from these maintenance skills.

## Dependencies and execution order

1. **Device trust:** macOS/Linux user, networking, FileVault/MDM where applicable, Git/SSL/curl.
2. **mise install:** official installer or approved package manager; `$HOME/.local/bin` and an approved `$HOME/bin`
   installation are placed on PATH before managed activation runs.
3. **Repo trust:** every device uses the reviewed `https://github.com/spuranam/bootstrap` seed or an approved mirror.
   Populate the active config by direct Git clone or one-way rsync from a reviewed local Git checkout. Rsync copies
   files, not Git history. No `bw` is required.
4. **Selection:** `miserc.local.toml` remains local and ignored.
5. **Lock:** the seed maintainer resolves and reviews all capabilities; consumers require committed locks.
6. **Plan:** strict locked `mise bootstrap --dry-run`, plus `mise dot diff`.
7. **Apply:** after approval, locked bootstrap runs packages, dotfiles, activation, tools and the informational task.
8. **Auth:** approved, interactive GH/gcloud and selected provider/agent sign-in.
9. **Verify:** `mise doctor`, `mise doctor project`, module checks and CLI versions.
10. **Publish/update:** authorized maintainers update the Git seed with generated locks; consumers update by reviewed
    Git fast-forward or rsync from a reviewed source checkout.

## Python/Google Cloud nuance

Mise selects and installs the workstation Python (`3.14.10`). uv uses that selected interpreter without downloading
another one. A project-local `mise.toml` can select a different Python version, and uv can create its environment.

The gcloud archive backend needs a matching Python runtime during macOS installation. The workstation's pinned mise
Python `3.14.10` is also used by gcloud through an exact-version `CLOUDSDK_PYTHON` path in the macOS configuration.
Linux does not set this override and keeps the runtime supplied by its gcloud backend. Verify `mise tool gcloud` and
`gcloud info --format='value(basic.python_location)'`. See
[ADR-006](DECISIONS.md#adr-006--google-cloud-cli-uses-its-supported-python-runtime).

## Threat model / failure recovery

- The repo config itself can run commands. Treat every Git change as code review, and don't run an untrusted `--adopt`.
- The repository owns only portable shell activation and bridge lines. Device or organization-specific zsh content
  stays in untracked `~/.zshrc.local`; mise does not follow a `~/.zshrc` symlink when applying activation.
- An unlocked Bitwarden CLI session should not be put into shell startup, `.env`, dotfiles, build logs, or AI contexts.
- AI tools can execute commands with user authority; approval prompts are not OS sandboxing.
- Mise bootstrap is not transactional. Git reversion, mise dot history/undo and documented authentication recovery are
  independent mechanisms.
- Do not run on corporate devices unless approved; no blanket sudo.

## Deliberately out of scope for v5

Windows/WSL2 validation, a custom Go installer, headless secret automation, enterprise-specific policies/certificates,
automatic pruning, managed VPN setup, remote provisioners, auto-execution of AI MCP servers, drift daemons and
multi-machine credential replication.

See [DECISIONS.md](DECISIONS.md) for rationales and [README.md](README.md) for operational commands.
