# Agent feature workflow

The product Agent runtime is expected to use a state graph such as LangGraph. Keep it behind the chat API boundary.

1. Define state, tools, transitions, terminal states, and user-visible events.
2. Give every tool a typed input/output schema and bounded timeout.
3. Keep retrieval grounded in GraphRAG artifacts and retain source references.
4. Support cancellation, provider failure, empty retrieval, and malformed tool output.
5. Do not expose provider secrets or unrestricted filesystem tools.
6. Stream stable events to the UI and keep graph-navigation commands separate from answer text.
7. Run the complete quality gate once after the entire Agent feature is complete.
