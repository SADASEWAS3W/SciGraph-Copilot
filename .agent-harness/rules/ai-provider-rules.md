# AI provider rules

- Browser code never receives provider API keys.
- `.graphrag/providers.json` and `.env*` remain untracked.
- Local and cloud builds share lifecycle semantics but may have provider-specific readiness checks.
- Confirm completion model, embedding model, API base, concurrency, vector size, and cache namespace as one configuration unit.
- A missing Ollama service/model or missing cloud key must fail before expensive indexing begins.
- Provider errors must be surfaced from the engine log with a recovery action.
- Retries must be bounded. Stop requests must terminate the child process and settle application state.
- Tests must not require paid APIs. Provider tests use readiness checks, fixtures, or mocks unless explicitly running an integration test.
