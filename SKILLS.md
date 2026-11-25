# Agent Skills catalog

Agent Skills are **task-specific instructions** that compatible coding assistants load on demand. This file is a
human-readable directory; it is **not** an auto-discovered skill. The individual `SKILL.md` files are the standard
format. See [Agent Skills specification](https://agentskills.io/specification).

Repository-wide agent rules: [AGENTS.md](AGENTS.md). Operator documentation: [README.md](README.md). Security policy:
[docs/SECURITY.md](docs/SECURITY.md).

| Skill                                                                      | Use when                                                                           | Scope           |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------- |
| [workstation-bootstrap](.agents/skills/workstation-bootstrap/SKILL.md)     | Preparing, adopting, updating, or safely re-provisioning a macOS/Linux machine     | This repository |
| [mise-module-authoring](.agents/skills/mise-module-authoring/SKILL.md)     | Adding/removing tools, packages, dotfiles or optional capabilities                 | This repository |
| [credential-setup](.agents/skills/credential-setup/SKILL.md)               | Configuring SSH, GitHub, fnox providers or task-scoped secrets                     | This repository |
| [cloud-development](.agents/skills/cloud-development/SKILL.md)             | Configuring or checking gcloud, ADC, mise Python and cloud/Kubernetes capabilities | This repository |
| [workstation-diagnostics](.agents/skills/workstation-diagnostics/SKILL.md) | Debugging mise configuration, package provisioning, permissions or recovery        | This repository |

## Discovery and usage

Compatible tools (including OpenCode, Codex and GitHub Copilot) can discover project skills from
`.agents/skills/<name>/SKILL.md`, with version/tool-specific conditions. Open **this Git repository** as the working
project; merely installing its global mise configuration does not make its maintenance skills global.

Ask your assistant to perform a specific task such as _"Use the mise-module-authoring skill to add a pinned tool to the
Kubernetes module."_ Some assistants offer an explicit skill picker; automatic selection is not guaranteed.

Each skill has frontmatter with a unique `name`, a trigger-oriented `description`, and focused instructions. Skills do
not grant OS permissions or access to secrets; existing agent permissions and device policy still apply.

## Repository skills versus globally available developer skills

The five skills above maintain **this workstation repository**. They are intentionally not deployed globally by
`config.ai.toml`. For reusable Go, Kubernetes, Tekton or supply-chain development skills in _other_ repositories, prefer
dedicated, reviewed skills in those projects or an explicitly approved global `~/.agents/skills` collection.

Mise can discover skills shipped by certain installed tools: `mise skills ls`. Its `mise skills sync` links
tool-provided skills into an agent directory, which is a **different mechanism** from this repo's five maintained
skills. Do not enable automatic synchronization or link unreviewed skills globally by default. See
[mise skills documentation](https://mise.jdx.dev/cli/skills.html).

## Maintaining and validating skills

- Edit the canonical `.agents/skills/<name>/SKILL.md`. Do not duplicate the files into `.claude/skills` or
  `.github/skills` without a demonstrated compatibility need.
- Run `mise run verify:skills` after changes. It runs pinned markdownlint across every Markdown file before validating
  skill metadata and catalog links. Use `node tools/validate-skills.mjs` only when an offline metadata-only check is
  necessary.
- New skill directories are discovered automatically. Each must contain a conforming `SKILL.md` and be linked from this
  catalog; the five baseline skills remain required.
- CI applies the same combined gate. The local metadata validator is **not** a complete YAML/specification parser; use
  `skills-ref validate` if its reference CLI is installed for an additional check.
- Keep skills declarative and advisory. Never embed credentials, autonomous login, destructive commands, or unreviewed
  third-party scripts.
