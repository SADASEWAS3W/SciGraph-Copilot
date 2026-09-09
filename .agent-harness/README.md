# SciGraph Copilot Agent Harness

This directory implements a three-layer engineering harness:

1. `rules/`: project constraints and architecture contracts.
2. `task-workflow-profiles.json`, `workflows/`, and `skills/`: task routing and minimum workflows.
3. `scripts/` and `templates/`: executable quality gates and verification evidence.

The harness governs development work. It is separate from the future LangGraph runtime agent, which will orchestrate product tools such as GraphRAG search and graph navigation.

## Usage

At task start, select one profile and read only the rules and workflow it references. During implementation, use focused diagnostics as needed. At final completion, run the full suite once:

```powershell
pnpm harness:quality
```

Do not run the full suite after every phase. A failed final gate must be fixed and rerun because the task is not complete until the gate passes.
