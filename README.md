# AI Software House Rules Engine

A local-first Node.js CLI that installs an `AGENTS.md` workflow contract and manually selected specialist skills into an existing project. It does not create an AI model, VS Code extension, dashboard, hosted service, or dependency on another application.

> Status: MVP scaffold, version 0.1.1. Validate it in a disposable project before using it in a production repository.

## What it does

- Creates a project-level `AGENTS.md` that guides the AI agent through a sequential workflow: understand → plan → design → implement → verify → review → report.
- Installs selected skill files under `.ai-house/skills/`.
- Optionally creates a small `CLAUDE.md` or `GEMINI.md` adapter that points agents to the canonical rules.
- Records managed files and SHA-256 hashes in `.ai-house/manifest.json`.
- Supports update from a Git repository or local source directory.
- Refuses to overwrite existing project instruction files during initial installation.
- Detects local edits before update; `--force` explicitly allows replacement.
- Uninstall removes unchanged managed files and preserves locally modified files unless `--force` is specified.

## Requirements

- Node.js 20+
- Git installed for updates from a remote Git repository

## Run locally during development

From this repository directory:

```powershell
node .\bin\ai-house.js skills
node .\bin\ai-house.js init --project C:\path\to\test-project --skills frontend,backend --adapter none
node .\bin\ai-house.js status --project C:\path\to\test-project
node .\bin\ai-house.js doctor --project C:\path\to\test-project
```

If you omit `--skills`, the CLI prompts you to select skills manually. Core workflow skills (`software-house`, `planning`, `testing`, and `code-review`) are always included because they define the minimum operating process.

## Install directly in any project (no manual clone)

Open the terminal **inside the project you want to configure** and run:

```powershell
npx --yes --package=github:pradanadimas534/ai-software-house-rules-engine ai-house init --project . --adapter none --source https://github.com/pradanadimas534/ai-software-house-rules-engine.git
```

The CLI prompts you to choose skills. The command downloads the tool into npm's temporary/cache area; it does **not** clone the tool into your project folder. The generated `AGENTS.md` and selected skills are installed into the current project. Node.js 20+ and Git are required for this GitHub-based package flow.

Check the installation:

```powershell
npx --yes --package=github:pradanadimas534/ai-software-house-rules-engine ai-house status --project .
npx --yes --package=github:pradanadimas534/ai-software-house-rules-engine ai-house doctor --project .
```

To avoid repeatedly downloading the package and have the `ai-house` command available globally in your local development environment, use the optional linked installation below.

## Optional: clone and link for development

```powershell
git clone https://github.com/pradanadimas534/ai-software-house-rules-engine.git
cd ai-software-house-rules-engine
npm link
```

Then open a terminal in the target project and run `ai-house init`.

## Configure central Git updates

In the target project, initialize with the source URL:

```powershell
ai-house init --source https://github.com/pradanadimas534/ai-software-house-rules-engine.git
```

Or set the environment variable in PowerShell:

```powershell
$env:AI_HOUSE_SOURCE = "https://github.com/pradanadimas534/ai-software-house-rules-engine.git"
```

Then update from the target project:

```powershell
ai-house update
```

You can also provide `--source <git-url-or-local-directory>` directly to `update`. Remote updates use `git clone --depth 1` into a temporary directory and remove it afterward. Selected skill IDs and adapter choice are preserved. If a managed file has local edits, update stops rather than overwriting it; inspect/commit those edits, or deliberately use `--force` after reviewing the diff.

## CLI commands

| Command | Purpose |
|---|---|
| `ai-house init` | Install rules and manually select skills |
| `ai-house skills` | List available skills |
| `ai-house status` | Show installation state and update source |
| `ai-house doctor` | Check whether recorded managed files are present |
| `ai-house update` | Update managed rules from the central source |
| `ai-house uninstall` | Remove unchanged managed files, with confirmation |

Use `--project <path>` to target a directory other than the current working directory. Use `--force` only when you intentionally want to replace locally modified managed files during update or uninstall. Initial installation never overwrites existing `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, or selected skill files.

## Skills

- `software-house` — sequential workflow
- `planning` — requirements and acceptance criteria
- `ui-ux` — usability and accessibility
- `frontend` — frontend engineering
- `backend` — backend engineering and API safety
- `database` — schema and data safety
- `testing` — verification and honest test reporting
- `code-review` — correctness and security review
- `performance` — performance work
- `documentation` — docs and setup instructions

## Architecture

```text
bin/ai-house.js          CLI entrypoint and prompts
src/catalog.js           skill and adapter catalog
src/installer.js         init, update, conflict detection, uninstall
src/utils.js             filesystem, hashes, argument parsing
templates/AGENTS.md.tpl  canonical agent workflow contract
skills/*/SKILL.md        opt-in specialist instructions
adapters/*.tpl           optional agent-specific instruction pointers
test/                    Node.js built-in test suite
```

## Safety and limitations

- The tool installs instructions; it cannot force an agent to obey them or guarantee the host automatically reads `AGENTS.md`.
- Skills are plain Markdown and do not execute code.
- The default workflow describes sequential role lenses, not multiple AI agents. Parallel/subagent work is not part of this MVP.
- The first version uses file hashes to protect locally edited managed files. If you intentionally edit a managed file, update will ask you to resolve that conflict or explicitly use `--force`.
- This MVP does not yet implement three-way merging, automatic stack detection, telemetry, or remote worker execution.
- Test in a disposable project and inspect the diff before committing generated files.

## Development

```powershell
npm test
npm run check
```

## License

MIT. See `LICENSE`.
