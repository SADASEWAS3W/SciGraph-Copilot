# SciGraph Copilot Agent Guide

## Project identity

- Stack: Next.js 16, React 19, TypeScript, React Three Fiber, Three.js, d3-force-3d, Microsoft GraphRAG 3.1, Python 3.12, Ollama/OpenAI.
- Purpose: turn scientific PDFs into an inspectable knowledge graph and support evidence-grounded AI interaction.
- Package manager: pnpm. Python dependencies are locked by uv.

## Three-layer Agent Harness

1. Read `.agent-harness/rules/` before changing code in the affected domain.
2. Select the smallest matching profile from `.agent-harness/task-workflow-profiles.json` and follow its workflow.
3. Run `.agent-harness/scripts/run-quality-gates.ps1` once after the whole requested task is complete.

Do not run the full test suite after each implementation phase. Intermediate phases may use read-only inspection and focused diagnostics. Run the complete quality gate exactly once at final task completion unless the user explicitly requests otherwise.

## Architecture boundaries

- `components/` owns presentation, interaction, and WebGL rendering. It must not access the filesystem, Python, provider secrets, or Ollama directly.
- `app/api/` owns HTTP/SSE validation and stable response contracts. Keep route handlers thin.
- `lib/server/` owns GraphRAG processes, providers, files, conversion, and indexing lifecycle.
- `lib/graphData.ts` and `lib/forceSimulation.ts` own browser graph adaptation and layout behavior.
- Runtime data (`input/`, `output/`, `.build-jobs/`, `.graphrag/`, `.nltk_data/`, logs, caches) must not be committed.

## Required engineering behavior

- Preserve Ollama/OpenAI provider parity unless a change is explicitly provider-specific.
- Index lifecycle changes must account for start, stop, failure, SSE disconnect, page refresh/reattach, and child-process cleanup.
- Graph schema changes must be checked across conversion, API delivery, visualization, inspector, and chat consumers.
- Never expose API keys or provider configuration secrets to browser responses or logs.
- Preserve user files and unrelated worktree changes. Avoid unrelated refactors.
- User-visible errors must name the failed operation and a practical recovery action.
- Code and code comments use English. User communication defaults to Chinese.

## Completion

- Review the final diff for scope and secrets.
- Run the full quality gate once.
- Record meaningful high-risk changes using `.agent-harness/templates/change-ledger.example.json` when appropriate.
- Use Conventional Commits: `feat:`, `fix:`, `perf:`, `refactor:`, `test:`, `docs:`, `chore:`.
