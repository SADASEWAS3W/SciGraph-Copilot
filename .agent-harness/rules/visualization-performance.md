# Visualization performance rules

- Keep force simulation outside React render loops.
- Avoid rebuilding all node/edge objects for selection, hover, or minor metadata changes.
- Dispose geometries, materials, textures, controls, listeners, and animation frames on teardown.
- Use bounded labels/details and progressive disclosure for large graphs.
- Preserve camera controls, selection, community isolation, and inspector synchronization.
- Performance-sensitive changes require a representative large-graph check, not only a tiny fixture.
- Baseline targets: 1,000 nodes remain interactive; 5,000 nodes must degrade gracefully without crashing or unbounded memory growth.
