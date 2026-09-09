# Indexing change workflow

1. Identify affected states: preparation, spawn, running, partial conversion, publication, stop, and failure.
2. Check Windows and Unix executable resolution.
3. Check Ollama and OpenAI behavior or document why the change is provider-specific.
4. Preserve the last successful output until replacement publication succeeds.
5. Ensure SSE disconnect does not own or cancel the server job.
6. Ensure stop settles state and descendants are cleaned up.
7. At final completion, run the full quality gate once and capture one lifecycle smoke result.
