# Known Limitations & Performance Bounds

1. **Exhaustive View Serializability Factorial Complexity ($O(N!)$)**:
   - View equivalence evaluation requires checking candidate transaction order permutations.
   - For $N = 3$ transactions: 6 permutations.
   - For $N = 4$ transactions: 24 permutations.
   - For $N = 5$ transactions: 120 permutations.
   - For $N = 7$ transactions: 5,040 permutations.
   - Schedules with $N > 7$ transactions display an interactive performance warning.

2. **Supported Operations**:
   - The engine analyzes `READ` and `WRITE` data operations. Commit (`C1`) and Abort (`A1`) tokens are parsed and logged, but rollback abort logic is out of scope for standard schedule serializability analysis.
