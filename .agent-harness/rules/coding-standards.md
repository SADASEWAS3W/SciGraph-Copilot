# Coding standards

## TypeScript and React

- Keep strict TypeScript types and avoid new `any` usage.
- Use 2-space indentation and the repository's existing no-semicolon, single-quote style.
- Components use PascalCase; functions and variables use camelCase; constants use UPPER_SNAKE_CASE where appropriate.
- Keep client components focused on rendering and interaction. Extract server-only behavior to `lib/server/`.
- Clean up timers, subscriptions, event listeners, animation frames, and Three.js resources.
- Do not add state that can be derived from existing state.

## API and errors

- Validate route parameters at the boundary.
- Return stable machine-readable error codes plus safe user-facing messages.
- Do not leak stack traces, API keys, environment variables, or absolute user paths.
- Long-running work must expose observable progress and a terminal state.

## Python and GraphRAG

- Keep Python dependencies in `pyproject.toml` and `uv.lock`; never edit `.venv` packages.
- Prefer project-local executables and explicit environment variables.
- Keep GraphRAG settings compatible with the pinned GraphRAG version.

## Scope and completion

- Read surrounding code before editing.
- Do not refactor unrelated modules.
- Do not bypass lint, hooks, or quality gates.
- Run the complete quality suite once, after all phases of the requested task are finished.
