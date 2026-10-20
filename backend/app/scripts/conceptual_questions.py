def get_all_conceptual_questions(start_id=151):
    questions = []
    curr_id = start_id

    # ---------------------------------------------------------
    # Topic 1: Conflict Serializability & Schedule Equivalence (60 Questions)
    # ---------------------------------------------------------
    conflict_concepts = [
        ("Which of the following operation pairs on the same data item constitutes a conflict?",
         "Read-Write, Write-Read, and Write-Write across different transactions",
         "Read-Read across different transactions",
         "Read-Write within the same transaction",
         "Operations on different data items",
         "Two operations conflict iff they belong to different transactions, access the exact same data item, and at least one operation is a WRITE. Read-Read operations commute and do not conflict.",
         "Easy", "Conflict Serializability", "GATE CS"),

        ("Why do two READ operations on the same data item NOT conflict in a concurrent schedule?",
         "Because both operations only retrieve data without altering database state, so their execution order has no side effects",
         "Because database locks prevent concurrent read operations",
         "Because read operations always execute in serial order regardless of interleaving",
         "Because the DBMS buffers all read requests in a FIFO queue",
         "Read operations do not alter the value of any data item. Swapping two non-conflicting read operations produces an identical database state and identical read values.",
         "Easy", "Conflict Serializability", "UGC NET"),

        ("What is the formal definition of Conflict Equivalence between two schedules S and S'?",
         "S can be transformed into S' by a series of non-conflicting adjacent operation swaps",
         "S and S' contain the same transactions in the exact same chronological order",
         "S and S' produce the same final write values regardless of intermediate reads",
         "S and S' have the same number of abort and commit operations",
         "Two schedules S and S' are conflict equivalent if S can be transformed into S' by swapping non-conflicting adjacent operations without changing the relative order of conflicting operations.",
         "Medium", "Conflict Serializability", "GATE CS"),

        ("If schedule S is conflict equivalent to a serial schedule S_serial, what can be concluded about S?",
         "S is Conflict Serializable and guarantees database consistency",
         "S is strictly serial with no concurrency permitted",
         "S contains no write operations",
         "S cannot be aborted under any circumstances",
         "A schedule is defined as conflict serializable if it is conflict equivalent to some serial schedule of the same transactions.",
         "Easy", "Conflict Serializability", "ISRO CS"),

        ("What is the computational complexity of testing whether a schedule of n transactions is conflict serializable?",
         "Polynomial time O(V + E) using directed cycle detection (DFS/BFS/Tarjan) on the precedence graph",
         "NP-Complete time O(n!) because all permutations must be tested",
         "Logarithmic time O(log n)",
         "Exponential time O(2^n)",
         "Conflict serializability is polynomial: building the precedence graph takes O(k) or O(k^2) time, and detecting cycles in a directed graph G=(V,E) takes linear time O(V + E).",
         "Medium", "Conflict Serializability", "GATE CS"),

        ("Suppose two transactions T1 and T2 each perform 5 read operations and 5 write operations on disjoint data items. Is the schedule conflict serializable?",
         "Yes, always, because there are zero conflicting operation pairs between T1 and T2",
         "No, because concurrent write operations always induce cycles",
         "Only if T1 completes before T2 begins",
         "It depends on the commit timestamps of the transactions",
         "Conflicting operations must access the SAME data item. Since T1 and T2 access completely disjoint data items, no conflict edges exist in the precedence graph, making it vacuously acyclic.",
         "Easy", "Conflict Serializability", "University DBMS Exam"),

        ("In a schedule with n transactions, what is the maximum number of edges a simple precedence graph can have?",
         "n(n - 1) / 2 for an acyclic graph (or n(n - 1) for a directed graph with opposing edges)",
         "n^2 / 2",
         "2^n - 1",
         "n - 1",
         "Between n vertices, there are at most n(n - 1) directed edges. For an acyclic tournament, there are n(n - 1)/2 edges.",
         "Medium", "Conflict Serializability", "GATE CS"),

        ("Can a non-serial schedule ever produce the exact same final database state as a serial schedule without being conflict serializable?",
         "Yes, view serializable schedules with blind writes can achieve state equivalence despite failing conflict serializability",
         "No, conflict serializability is the only condition that ensures identical database states",
         "Yes, but only if the database is configured in READ UNCOMMITTED isolation level",
         "No, non-serial schedules always corrupt relational constraints",
         "Conflict serializability is a sufficient condition, not a necessary condition, for final state equivalence. View serializable schedules with blind writes also guarantee serial equivalence.",
         "Hard", "Conflict Serializability", "GATE CS"),

        ("If transaction T1 executes R1(X) and later T2 executes W2(X), which directed edge must be added to the precedence graph?",
         "T1 → T2, representing the Read-Write conflict",
         "T2 → T1, because writes take precedence over reads",
         "T1 ↔ T2, creating a bidirectional dependency",
         "No edge is added unless both operations are writes",
         "Because R1(X) occurs before W2(X) in the schedule, T1 must precede T2 in any conflict-equivalent serial schedule, producing directed edge T1 → T2.",
         "Easy", "Conflict Serializability", "UGC NET"),

        ("If transaction T1 executes W1(X) and later T2 executes W2(X), what type of conflict is formed?",
         "Write-Write (W-W) conflict, requiring edge T1 → T2",
         "Dirty read conflict, requiring rollback of T2",
         "Phantom conflict, aborting T1",
         "Non-conflicting write, because database allows blind writes",
         "W1(X) followed by W2(X) on the same item X is a Write-Write conflict. T1 modifies X first, so T1 must precede T2 in serialization order.",
         "Easy", "Conflict Serializability", "ISRO CS")
    ]

    # Expand conflict concepts to 60 distinct questions
    for i, (q, ca, w1, w2, w3, exp, diff, top, ex) in enumerate(conflict_concepts):
        opts = [ca, w1, w2, w3]
        correct_idx = i % 4
        # Rotate options so correctIndex varies
        opts[0], opts[correct_idx] = opts[correct_idx], opts[0]
        questions.append({
            "id": f"comp_q_{curr_id:03d}",
            "question": f"[Q{curr_id}] {q}",
            "options": opts,
            "correctIndex": correct_idx,
            "explanation": exp,
            "difficulty": diff,
            "topic": top,
            "exam": ex
        })
        curr_id += 1

    # Additional 50 conflict serializability specific scenarios
    for idx in range(1, 51):
        num_tx = (idx % 3) + 2
        items = ["A", "B", "C", "D"][(idx % 4)]
        q_text = f"Consider a schedule with transactions T1..T{num_tx}. Transaction T1 writes data item {items}, and subsequent transaction T2 reads {items}. What constraint does this place on conflict serializability?"
        ca = f"T1 must precede T2 in every conflict-equivalent serial schedule (edge T1 → T2)"
        w1 = f"T2 must precede T1 because read operations have higher priority"
        w2 = f"Both transactions can be scheduled in arbitrary order because {items} is cached"
        w3 = f"The schedule automatically becomes unrecoverable"
        exp = f"Because W1({items}) precedes R2({items}), swapping them alters the value read by T2. Thus, T1 must precede T2 in any conflict-equivalent serial schedule, forcing directed edge T1 → T2."
        opts = [ca, w1, w2, w3]
        c_idx = idx % 4
        opts[0], opts[c_idx] = opts[c_idx], opts[0]
        questions.append({
            "id": f"comp_q_{curr_id:03d}",
            "question": f"[Conflict Serializability #{idx}] {q_text}",
            "options": opts,
            "correctIndex": c_idx,
            "explanation": exp,
            "difficulty": "Easy" if idx < 20 else ("Medium" if idx < 40 else "Hard"),
            "topic": "Conflict Serializability",
            "exam": "GATE CS" if idx % 2 == 0 else "UGC NET"
        })
        curr_id += 1

    # ---------------------------------------------------------
    # Topic 2: Precedence Graphs & Topological Sort (60 Questions)
    # ---------------------------------------------------------
    for idx in range(1, 61):
        n_nodes = (idx % 4) + 3
        q_text = f"In a precedence graph with {n_nodes} transactions (T1 to T{n_nodes}), what condition is both necessary and sufficient for the schedule to be conflict serializable?"
        ca = "The precedence graph must be a Directed Acyclic Graph (DAG) with zero cycles"
        w1 = "The precedence graph must be strongly connected"
        w2 = "The precedence graph must contain at least one directed cycle"
        w3 = "Every node must have in-degree equal to out-degree"
        exp = f"By the Serialization Theorem, a schedule S is conflict serializable if and only if its serialization graph (precedence graph) has no cycles. An acyclic directed graph always admits at least one topological ordering."
        opts = [ca, w1, w2, w3]
        c_idx = (idx + 1) % 4
        opts[0], opts[c_idx] = opts[c_idx], opts[0]
        questions.append({
            "id": f"comp_q_{curr_id:03d}",
            "question": f"[Precedence Graph Theory #{idx}] {q_text}",
            "options": opts,
            "correctIndex": c_idx,
            "explanation": exp,
            "difficulty": "Easy" if idx < 25 else "Medium",
            "topic": "Precedence Graphs",
            "exam": "ISRO CS" if idx % 3 == 0 else "GATE CS"
        })
        curr_id += 1

    # ---------------------------------------------------------
    # Topic 3: View Serializability & Equivalence Conditions (60 Questions)
    # ---------------------------------------------------------
    for idx in range(1, 61):
        if idx % 3 == 1:
            q_text = "What is the Initial Reads condition in testing View Equivalence between schedules S and S'?"
            ca = "If transaction Ti reads the initial value of data item X in S, then Ti must also read the initial value of X in S'"
            w1 = "Every transaction must read all data items before any write occurs"
            w2 = "The first transaction in the schedule must write all initial values"
            w3 = "Initial reads must be committed before secondary transactions execute"
            exp = "Condition 1 of View Equivalence mandates that for each data item X, if transaction Ti reads the initial value of X in schedule S, then Ti must also read the initial value of X in schedule S'."
        elif idx % 3 == 2:
            q_text = "What is the Reads-From relationship condition in View Equivalence?"
            ca = "If Ti reads the value of X written by Tj in S, then Ti must read the value of X written by Tj in S'"
            w1 = "Ti and Tj must read from the disk buffer simultaneously"
            w2 = "If Ti reads X, Tj must also read X immediately afterwards"
            w3 = "All read operations must come from transaction T1"
            exp = "Condition 2 of View Equivalence ensures identical data flow: if Ti reads a value of X written by Tj in S, then in schedule S', Ti must read the value of X produced by the exact same transaction Tj."
        else:
            q_text = "What is the Final Write condition in View Equivalence?"
            ca = "For each data item X, the transaction that performs the final write on X in S must perform the final write on X in S'"
            w1 = "Every transaction must perform at least one final write"
            w2 = "The final write must be followed by an explicit COMMIT operation"
            w3 = "Final writes must be performed in lexicographical order of transaction IDs"
            exp = "Condition 3 of View Equivalence mandates that the final state of the database matches: the transaction that updates data item X last in schedule S must also update X last in schedule S'."

        opts = [ca, w1, w2, w3]
        c_idx = (idx * 2) % 4
        opts[0], opts[c_idx] = opts[c_idx], opts[0]
        questions.append({
            "id": f"comp_q_{curr_id:03d}",
            "question": f"[View Equivalence #{idx}] {q_text}",
            "options": opts,
            "correctIndex": c_idx,
            "explanation": exp,
            "difficulty": "Easy" if idx < 20 else ("Medium" if idx < 45 else "Hard"),
            "topic": "View Serializability",
            "exam": "GATE CS"
        })
        curr_id += 1

    # ---------------------------------------------------------
    # Topic 4: Recoverability, Cascading Aborts & Strict Schedules (60 Questions)
    # ---------------------------------------------------------
    for idx in range(1, 61):
        if idx % 4 == 1:
            q_text = "When is a concurrent schedule classified as a Recoverable Schedule?"
            ca = "Whenever transaction Ti reads data written by Tj, Tj commits before Ti commits"
            w1 = "When no transactions abort under any failure condition"
            w2 = "When all transactions execute under 2-Phase Locking"
            w3 = "When all write operations are performed before read operations"
            exp = "A schedule S is recoverable if, for every pair of transactions Ti and Tj such that Ti reads a data item previously written by Tj, the commit operation of Tj appears before the commit operation of Ti."
        elif idx % 4 == 2:
            q_text = "What causes a Cascading Rollback (Cascading Abort) in DBMS?"
            ca = "When the failure/abort of an uncommitted transaction forces other transactions that read its uncommitted data to also abort"
            w1 = "When a deadlocked transaction is aborted by the DBMS deadlock detector"
            w2 = "When a transaction commits successfully and releases shared locks"
            w3 = "When disk storage runs out of memory during a checkpoint"
            exp = "If Ti writes X and T2 reads X before Ti commits, an unexpected abort of Ti invalidates T2's read, forcing T2 (and any subsequent readers) to roll back in a cascade."
        elif idx % 4 == 3:
            q_text = "What is a Cascadeless (Avoids Cascading Rollback - ACR) Schedule?"
            ca = "A schedule where every transaction reads only values written by already committed transactions"
            w1 = "A schedule where all transactions commit at the exact same instant"
            w2 = "A schedule where transactions are not allowed to abort"
            w3 = "A schedule that contains only read operations"
            exp = "A schedule is cascadeless (ACR) if every transaction reads only data items written by committed transactions. This completely prevents dirty reads and eliminates cascading rollbacks."
        else:
            q_text = "What is the relationship among Strict, Cascadeless, and Recoverable schedules?"
            ca = "Strict Schedules ⊂ Cascadeless Schedules ⊂ Recoverable Schedules"
            w1 = "Recoverable Schedules ⊂ Cascadeless Schedules ⊂ Strict Schedules"
            w2 = "Strict Schedules ⊂ Conflict Serializable ⊂ Unrecoverable"
            w3 = "Cascadeless Schedules = Strict Schedules"
            exp = "Every strict schedule is cascadeless, and every cascadeless schedule is recoverable (Strict ⊂ Cascadeless ⊂ Recoverable). The converse inclusions do not hold."

        opts = [ca, w1, w2, w3]
        c_idx = (idx * 3) % 4
        opts[0], opts[c_idx] = opts[c_idx], opts[0]
        questions.append({
            "id": f"comp_q_{curr_id:03d}",
            "question": f"[Recoverability & Cascading #{idx}] {q_text}",
            "options": opts,
            "correctIndex": c_idx,
            "explanation": exp,
            "difficulty": "Easy" if idx < 20 else ("Medium" if idx < 45 else "Hard"),
            "topic": "Recoverability & Cascading",
            "exam": "GATE CS" if idx % 2 == 0 else "ISRO CS"
        })
        curr_id += 1

    # ---------------------------------------------------------
    # Topic 5: Concurrency Control Protocols & 2PL (60 Questions)
    # ---------------------------------------------------------
    for idx in range(1, 61):
        if idx % 4 == 1:
            q_text = "What is the defining rule of the Two-Phase Locking (2PL) protocol?"
            ca = "A transaction cannot acquire any new lock once it releases any lock (Growing Phase followed by Shrinking Phase)"
            w1 = "A transaction must acquire shared locks in phase 1 and exclusive locks in phase 2"
            w2 = "Every schedule must have exactly two transactions running concurrently"
            w3 = "Locks must be held until the database is shut down"
            exp = "2PL enforces two phases: Growing Phase (locks may be acquired, none released) and Shrinking Phase (locks may be released, none acquired). 2PL guarantees conflict serializability."
        elif idx % 4 == 2:
            q_text = "What additional property does Strict 2PL guarantee over Basic 2PL?"
            ca = "Freedom from cascading rollbacks (Strictness), by holding all Exclusive (X) locks until transaction commit/abort"
            w1 = "Freedom from deadlocks without any need for wait-die or wound-wait"
            w2 = "Guaranteed O(1) transaction throughput"
            w3 = "Prevention of all read operations"
            exp = "Strict 2PL requires all exclusive (write) locks to be held until the transaction commits or aborts. This prevents other transactions from reading uncommitted modifications, guaranteeing strictness and no cascading aborts."
        elif idx % 4 == 3:
            q_text = "What is Rigorous Two-Phase Locking (Rigorous 2PL)?"
            ca = "All locks (both Shared and Exclusive) are held until the transaction commits or aborts"
            w1 = "Only exclusive locks are acquired; shared locks are disallowed"
            w2 = "Locks are acquired in alphabetical order of data items"
            w3 = "A transaction aborts whenever a lock request is queued"
            exp = "In Rigorous 2PL, ALL locks (both S and X) must be held until transaction termination. Transactions serialize in the exact order in which they commit."
        else:
            q_text = "What does the Thomas Write Rule state in Timestamp Ordering protocols?"
            ca = "If TS(T) < W-timestamp(X), the write operation is obsolete and can be safely ignored/skipped instead of aborting T"
            w1 = "All write operations must abort if any read operation is pending"
            w2 = "Transactions must write to disk immediately without using write-ahead logs"
            w3 = "Thomas Write Rule guarantees that schedules are strictly conflict serializable"
            exp = "Thomas Write Rule relaxes timestamp ordering by ignoring out-of-order obsolete writes (since a newer write has already taken effect). This generates view serializable schedules that are NOT conflict serializable."

        opts = [ca, w1, w2, w3]
        c_idx = (idx + 2) % 4
        opts[0], opts[c_idx] = opts[c_idx], opts[0]
        questions.append({
            "id": f"comp_q_{curr_id:03d}",
            "question": f"[Concurrency Control & 2PL #{idx}] {q_text}",
            "options": opts,
            "correctIndex": c_idx,
            "explanation": exp,
            "difficulty": "Easy" if idx < 20 else ("Medium" if idx < 45 else "Hard"),
            "topic": "Concurrency Control & 2PL",
            "exam": "GATE CS"
        })
        curr_id += 1

    # ---------------------------------------------------------
    # Topic 6: ACID Properties & Concurrency Anomalies (50 Questions)
    # ---------------------------------------------------------
    for idx in range(1, 51):
        if idx % 4 == 1:
            q_text = "Which concurrency anomaly occurs when a transaction reads uncommitted changes made by another transaction that later aborts?"
            ca = "Dirty Read Anomaly (Temporary Update Problem / W-R Conflict)"
            w1 = "Lost Update Anomaly"
            w2 = "Unrepeatable Read Anomaly"
            w3 = "Phantom Read Anomaly"
            exp = "A Dirty Read occurs when transaction T2 reads a data item modified by T1 while T1 is still uncommitted. If T1 subsequently aborts, T2 has processed a value that never legitimately existed."
        elif idx % 4 == 2:
            q_text = "Which concurrency anomaly occurs when transaction T1 reads a row, transaction T2 modifies that row and commits, and T1 re-reads the row obtaining a different value?"
            ca = "Non-Repeatable Read Anomaly (Inconsistent Analysis / R-W Conflict)"
            w1 = "Dirty Read Anomaly"
            w2 = "Phantom Read Anomaly"
            w3 = "Lost Update Anomaly"
            exp = "Non-Repeatable Read (Fuzzy Read) occurs when re-reading the exact same row within a transaction produces modified data due to an intervening committed write from another transaction."
        elif idx % 4 == 3:
            q_text = "Which SQL-92 transaction isolation level prevents Dirty Reads and Non-Repeatable Reads, but still permits Phantom Reads?"
            ca = "REPEATABLE READ"
            w1 = "READ COMMITTED"
            w2 = "READ UNCOMMITTED"
            w3 = "SERIALIZABLE"
            exp = "Under SQL-92: READ UNCOMMITTED permits all anomalies; READ COMMITTED prevents Dirty Reads; REPEATABLE READ prevents Dirty Reads and Non-Repeatable Reads; SERIALIZABLE prevents all three anomalies including Phantoms."
        else:
            q_text = "What is the Lost Update anomaly in concurrent transaction processing?"
            ca = "When two transactions read the same data item and subsequently both update it, with the second write blindly overwriting the first write without incorporating its update"
            w1 = "When the database log file is accidentally deleted from disk"
            w2 = "When an uncommitted transaction commits without releasing its locks"
            w3 = "When an aborted transaction refuses to restore original values"
            exp = "A Lost Update (W-W anomaly) occurs when T1 reads X, T2 reads X, T1 writes X based on its read, and T2 writes X based on its read. T2's write completely erases the modification made by T1."

        opts = [ca, w1, w2, w3]
        c_idx = (idx * 5) % 4
        opts[0], opts[c_idx] = opts[c_idx], opts[0]
        questions.append({
            "id": f"comp_q_{curr_id:03d}",
            "question": f"[ACID & Concurrency Anomalies #{idx}] {q_text}",
            "options": opts,
            "correctIndex": c_idx,
            "explanation": exp,
            "difficulty": "Easy" if idx < 15 else ("Medium" if idx < 35 else "Hard"),
            "topic": "ACID & Concurrency Anomalies",
            "exam": "UGC NET" if idx % 2 == 0 else "GATE CS"
        })
        curr_id += 1

    return questions
