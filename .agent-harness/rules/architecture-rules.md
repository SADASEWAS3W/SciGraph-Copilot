# Architecture rules

## Runtime flow

```text
PDF upload
  -> app/api/corpus/*
  -> lib/server/indexJob.ts
  -> GraphRAG + Ollama/OpenAI
  -> parquet + LanceDB
  -> lib/server/converters.ts
  -> JSON APIs
  -> GraphVisualizer + Inspector + ChatPanel
```

## Boundaries

### UI layer

`app/page.tsx` composes the workspace. `components/` renders UI and graph interactions. Client code may call only application APIs and must not read local paths, invoke child processes, or receive provider secrets.

### API layer

`app/api/` validates inputs, maps domain failures to stable codes, and streams progress. Route handlers delegate filesystem, provider, and indexing work to `lib/server/`.

### Server domain layer

`lib/server/` owns mutable local state and external processes. Index jobs are server-owned and must outlive an SSE subscriber. A terminal job has exactly one of `succeeded`, `failed`, or `stopped` and a `finishedAt` timestamp.

### Data layer

GraphRAG parquet files are canonical runtime artifacts. JSON is a presentation adapter. The supported graph contract includes entities, relationships, communities, community reports, and text units. Runtime artifacts are local and excluded from Git.

## Cross-cutting contracts

- Ollama and OpenAI use the same application-level build states.
- Provider cache directories are isolated by provider/model signature.
- Embedding dimensions must match the configured model and LanceDB schema.
- Windows prefers project-local `.venv/Scripts` executables; Unix prefers `.venv/bin`.
- Closing or refreshing the browser must not stop indexing.
- Destructive project/file operations require exact resolved targets and must not affect paths outside the repository runtime directories.
