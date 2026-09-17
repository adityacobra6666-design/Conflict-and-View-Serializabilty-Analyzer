# DBMS Algorithms Specification

## 1. Schedule Parser & Validator

The parser transforms schedule string tokens into structured `Operation` objects:
- Supported syntaxes: `R1(X)`, `W2(Y)`, `r1[X]`, `w2[Y]`, `T1: R(X)`, `T2: WRITE(Y)`.
- Ignores commit/abort markers (`C1`, `A1`).
- Normalizes data items to uppercase (`X`, `Y`) and transactions to standard identifiers (`T1`, `T2`).

## 2. Conflict Serializability Engine

### Conflict Pair Scanning
Two operations $op_i \in T_a$ and $op_j \in T_b$ at schedule indices $i < j$ conflict iff:
1. $T_a \neq T_b$ (Different transactions)
2. $op_i.\text{item} == op_j.\text{item}$ (Same data item)
3. $op_i.\text{type} == \text{'WRITE'} \lor op_j.\text{type} == \text{'WRITE'}$ (At least one WRITE)

Conflicts are classified as:
- **READ-WRITE (RW)**: $R_a(X) \dots W_b(X)$
- **WRITE-READ (WR)**: $W_a(X) \dots R_b(X)$
- **WRITE-WRITE (WW)**: $W_a(X) \dots W_b(X)$

### Precedence Graph & Cycle Detection
- Directed edge $T_a \to T_b$ added for each conflict.
- DFS back-edge detection identifies directed cycles ($T_a \to T_b \dots \to T_a$).
- If graph is acyclic, topological sort backtracking generates all valid serial transaction orders.
