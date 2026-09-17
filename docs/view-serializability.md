# View Serializability & Equivalence Specification

## Equivalence Conditions

A candidate serial transaction schedule $S'$ is view-equivalent to original schedule $S$ iff all three conditions hold:

### 1. Initial Reads Condition
For every data item $X$:
If $R_i(X)$ in $S$ reads the initial value of $X$ (no preceding write on $X$), then $R_i(X)$ in $S'$ must also read the initial value of $X$.

### 2. Reads-From Condition
For every read operation $R_i(X)$ in $S$:
If $R_i(X)$ reads the value written by $W_j(X)$ in $S$, then in $S'$, $R_i(X)$ must read from the same transaction $T_j$.

### 3. Final Writes Condition
For every data item $X$:
The transaction $T_k$ that performs the final write $W_k(X)$ in $S$ must also perform the final write on $X$ in $S'$.

## Blind Write Special Case
Schedule $S = R_1(X), W_2(X), W_1(X), W_3(X)$ contains a conflict cycle $T_1 \leftrightarrow T_2$.
However, candidate serial schedule $S' = T_1 \to T_2 \to T_3$ satisfies all 3 view conditions!
Therefore, $S$ is View Serializable despite failing Conflict Serializability.
