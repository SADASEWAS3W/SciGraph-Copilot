# Bug-fix workflow

1. Reproduce and capture the observable failure.
2. Identify the owning layer and select the matching task profile.
3. Read the relevant source and engine/browser logs.
4. State the root cause separately from incidental warnings.
5. Implement the smallest safe correction.
6. Check adjacent lifecycle, provider, data-contract, and UI states as applicable.
7. After all fix phases are complete, run the full quality gate once.
8. Record root cause, fix, verification, and remaining risk for L2/L3 defects.
