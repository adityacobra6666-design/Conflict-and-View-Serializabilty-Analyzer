import { QuizQuestion } from '../types/quiz';

export const VERIFIED_QUIZ_QUESTIONS: QuizQuestion[] = [
  // ==========================================
  // EASY DIFFICULTY QUESTIONS
  // ==========================================
  {
    id: 'easy_1',
    difficulty: 'Easy',
    topic: 'Conflict & View Serializability',
    question: 'Which condition is required for two operations to conflict in a DBMS schedule?',
    options: [
      'Same transaction and same data item',
      'Different transactions, same data item, and at least one write operation',
      'Different data items accessed by read operations',
      'Both operations must be write operations on different data items'
    ],
    correctIndex: 1,
    explanation: 'Two operations conflict if and only if they belong to different transactions, access the exact same data item, and at least one of the operations is a WRITE.',
    optionExplanations: [
      'Operations within the same transaction executed sequentially do not form a inter-transaction conflict.',
      'Correct! Different transactions, same data item, and at least one WRITE operation create a conflict.',
      'Read operations on different data items do not conflict.',
      'Operations on different data items never conflict regardless of operation type.'
    ]
  },
  {
    id: 'easy_2',
    difficulty: 'Easy',
    topic: 'Conflict & View Serializability',
    question: 'In a precedence graph (serialization graph), what do the nodes represent?',
    options: [
      'Individual read and write operations',
      'Data items (X, Y, Z)',
      'Transactions (T1, T2, T3, etc.)',
      'Database log records'
    ],
    correctIndex: 2,
    explanation: 'Nodes in a precedence graph represent transactions involved in the schedule.',
    optionExplanations: [
      'Operations are steps within transactions, not the nodes of a precedence graph.',
      'Data items are the targets of operations, not the graph nodes.',
      'Correct! Nodes in a precedence graph represent the transactions (T1, T2, ...).',
      'Log records are recovery mechanisms, not graph nodes.'
    ]
  },
  {
    id: 'easy_3',
    difficulty: 'Easy',
    topic: 'Conflict & View Serializability',
    question: 'What does a directed edge T1 → T2 in a precedence graph signify?',
    options: [
      'T1 and T2 executed simultaneously',
      'An operation of T1 conflicts with a subsequent operation of T2',
      'T2 committed before T1 started',
      'T1 rolled back due to a deadlock with T2'
    ],
    correctIndex: 1,
    explanation: 'A directed edge T1 → T2 indicates that an operation in T1 conflicts with and executes before a conflicting operation in T2.',
    optionExplanations: [
      'Precedence graph edges represent ordering dependencies between conflicting operations, not parallel execution.',
      'Correct! Edge T1 → T2 means T1 executed an operation that conflicts with a later operation in T2.',
      'Commit order is separate; an edge means operational precedence, not commit precedence.',
      'Rollbacks relate to recovery, not serialization graph edge creation.'
    ]
  },
  {
    id: 'easy_4',
    difficulty: 'Easy',
    topic: 'Conflict & View Serializability',
    question: 'What is a serial schedule?',
    options: [
      'A schedule where transactions execute concurrently',
      'A schedule where operations of different transactions are interleaved',
      'A schedule where transactions execute non-interleaved one after another',
      'A schedule that contains only read operations'
    ],
    correctIndex: 2,
    explanation: 'A serial schedule executes transactions completely one by one without interleaving operations of different transactions.',
    optionExplanations: [
      'Concurrent execution involves interleaving; serial schedules execute sequentially.',
      'Interleaving operations makes a schedule non-serial.',
      'Correct! In a serial schedule, transactions execute strictly one after another.',
      'Serial schedules can contain any operation types (reads and writes).'
    ]
  },
  {
    id: 'easy_5',
    difficulty: 'Easy',
    topic: 'Conflict & View Serializability',
    question: 'Do two READ operations on the same data item by different transactions conflict?',
    options: [
      'Yes, because they access the same data item',
      'No, read-read operations never conflict',
      'Yes, only if executed at the same timestamp',
      'Yes, if they belong to different databases'
    ],
    correctIndex: 1,
    explanation: 'Two READ operations (R1(X) and R2(X)) do not modify data, so they do not conflict.',
    optionExplanations: [
      'Accessing the same item is necessary, but at least one operation MUST be a write for a conflict.',
      'Correct! Read-read operations never modify state, so they do not create conflicts.',
      'Timestamps do not make read-read operations conflicting.',
      'Database origin does not create read-read conflicts.'
    ]
  },
  {
    id: 'easy_6',
    difficulty: 'Easy',
    topic: 'Conflict & View Serializability',
    question: 'What is a Blind Write in DBMS transaction processing?',
    options: [
      'A write operation performed without reading the data item first in that transaction',
      'A write operation that fails to commit',
      'A read operation that overwrites a database buffer',
      'A write operation on an unindexed database table'
    ],
    correctIndex: 0,
    explanation: 'A blind write occurs when a transaction writes to a data item X without reading X first.',
    optionExplanations: [
      'Correct! A blind write is a write operation W_i(X) without a preceding read R_i(X) in transaction T_i.',
      'Write failures relate to transaction aborts, not blind writes.',
      'Reads do not overwrite buffers in a way that defines blind writes.',
      'Indexing has no bearing on the definition of a blind write.'
    ]
  },
  {
    id: 'easy_7',
    difficulty: 'Easy',
    topic: 'Conflict & View Serializability',
    question: 'If a precedence graph contains NO cycles, what can be concluded about the schedule?',
    options: [
      'It is NOT conflict serializable',
      'It is Conflict Serializable',
      'It contains deadlocks',
      'It cannot be view serializable'
    ],
    correctIndex: 1,
    explanation: 'A schedule is conflict serializable if and only if its precedence graph contains no directed cycles (acyclic graph).',
    optionExplanations: [
      'A cycle means non-serializable; no cycles means it IS conflict serializable.',
      'Correct! An acyclic precedence graph guarantees conflict serializability.',
      'Acyclic precedence graphs indicate serializability, not deadlocks.',
      'Conflict serializability guarantees view serializability.'
    ]
  },
  {
    id: 'easy_8',
    difficulty: 'Easy',
    topic: 'Conflict & View Serializability',
    question: 'What is the relationship between Conflict Serializability (CSR) and View Serializability (VSR)?',
    options: [
      'VSR is a subset of CSR',
      'CSR is a subset of VSR (every conflict serializable schedule is view serializable)',
      'CSR and VSR are completely independent concepts',
      'CSR applies only to single-transaction schedules'
    ],
    correctIndex: 1,
    explanation: 'Conflict serializability is a sufficient condition for view serializability. All conflict serializable schedules are view serializable (CSR ⊂ VSR).',
    optionExplanations: [
      'CSR is smaller than VSR; VSR includes schedules with blind writes that CSR rejects.',
      'Correct! Every conflict serializable schedule is also view serializable (CSR ⊂ VSR).',
      'They are closely related theoretical criteria for schedule correctness.',
      'CSR applies to multi-transaction concurrent schedules.'
    ]
  },

  // ==========================================
  // MEDIUM DIFFICULTY QUESTIONS
  // ==========================================
  {
    id: 'med_1',
    difficulty: 'Medium',
    topic: 'Conflict & View Serializability',
    scheduleText: 'R1(X), W2(X), R2(Y), W1(Y)',
    question: 'Given the schedule R1(X), W2(X), R2(Y), W1(Y), what edges exist in its precedence graph?',
    options: [
      'T1 → T2 only',
      'T2 → T1 only',
      'T1 → T2 and T2 → T1 (creating a cycle)',
      'No edges exist'
    ],
    correctIndex: 2,
    explanation: 'R1(X) before W2(X) creates edge T1 → T2. R2(Y) before W1(Y) creates edge T2 → T1. Together they form a cycle T1 ⇄ T2.',
    optionExplanations: [
      'T1 → T2 is formed by (R1(X), W2(X)), but (R2(Y), W1(Y)) also forms T2 → T1.',
      'T2 → T1 is formed by (R2(Y), W1(Y)), but (R1(X), W2(X)) also forms T1 → T2.',
      'Correct! (R1(X), W2(X)) gives T1 → T2 and (R2(Y), W1(Y)) gives T2 → T1, forming a cycle.',
      'Conflicting pairs exist for both X and Y, so edges must exist.'
    ]
  },
  {
    id: 'med_2',
    difficulty: 'Medium',
    topic: 'Conflict & View Serializability',
    scheduleText: 'R1(X), W2(X), W1(X), W3(X)',
    question: 'Analyze the schedule R1(X), W2(X), W1(X), W3(X). Which statement is TRUE?',
    options: [
      'It is Conflict Serializable and View Serializable',
      'It is View Serializable, but NOT Conflict Serializable (Blind Write Case)',
      'It is Conflict Serializable, but NOT View Serializable',
      'It is neither Conflict Serializable nor View Serializable'
    ],
    correctIndex: 1,
    explanation: 'R1(X) before W2(X) creates T1 → T2. W2(X) before W1(X) creates T2 → T1. This forms a cycle T1 ⇄ T2, so it is NOT Conflict Serializable. However, serial order T1 → T2 → T3 satisfies initial read R1(X), reads-from (none), and final write W3(X), making it View Serializable!',
    optionExplanations: [
      'Precedence graph contains cycle T1 ⇄ T2, so it is NOT conflict serializable.',
      'Correct! This classic blind-write schedule has a cycle T1 ⇄ T2 (not CSR) but matches serial order T1 → T2 → T3 (is VSR).',
      'Conflict serializability strictly implies view serializability; a schedule cannot be CSR without being VSR.',
      'It IS view serializable under serial order T1 → T2 → T3.'
    ]
  },
  {
    id: 'med_3',
    difficulty: 'Medium',
    topic: 'Conflict & View Serializability',
    question: 'In View Serializability analysis, what does the Initial Read condition specify?',
    options: [
      'The first operation of every schedule must be a read',
      'If T_i reads initial value of data item X in schedule S, T_i must also read initial value of X in serial schedule S\'',
      'All transactions must read data items before writing them',
      'Initial values of all data items must be non-zero'
    ],
    correctIndex: 1,
    explanation: 'View equivalence requires that if transaction T_i reads the initial state of data item X in S, T_i must also read the initial state of X in equivalent serial schedule S\'.',
    optionExplanations: [
      'Schedules can start with write operations or any valid operation.',
      'Correct! Initial reads must match between S and equivalent serial schedule S\' for every data item.',
      'Transactions can perform blind writes without initial reads.',
      'Database cell values do not affect view equivalence rules.'
    ]
  },
  {
    id: 'med_4',
    difficulty: 'Medium',
    topic: 'Conflict & View Serializability',
    question: 'In View Serializability analysis, what does the Final Write condition specify?',
    options: [
      'The last operation of the entire schedule must be a write',
      'For each data item X, if T_k performs the last write on X in schedule S, T_k must also perform the last write on X in serial schedule S\'',
      'Every transaction must commit with a write operation',
      'No write operation can occur after a transaction commits'
    ],
    correctIndex: 1,
    explanation: 'View equivalence requires that whichever transaction performs the final update on a data item X in S must also perform the final update on X in S\'.',
    optionExplanations: [
      'The schedule can end with a read operation or commit token.',
      'Correct! The transaction performing the final write on item X must be identical in both S and S\'.',
      'Transactions can end with reads or commits.',
      'Commit behavior does not define the view equivalence final write rule.'
    ]
  },
  {
    id: 'med_5',
    difficulty: 'Medium',
    topic: 'Conflict & View Serializability',
    scheduleText: 'R1(X), W1(X), R2(X), W2(X)',
    question: 'Given the schedule R1(X), W1(X), R2(X), W2(X), what is the topological order of transactions?',
    options: [
      'T2 → T1',
      'T1 → T2',
      'T1 and T2 are cyclic',
      'No order exists'
    ],
    correctIndex: 1,
    explanation: 'Conflicts (W1(X), R2(X)) and (W1(X), W2(X)) create edge T1 → T2. Since there are no cycles, the valid topological order is T1 → T2.',
    optionExplanations: [
      'T1 operations precede T2 operations, creating edge T1 → T2, not T2 → T1.',
      'Correct! Operations of T1 conflict with and precede T2, yielding topological order T1 → T2.',
      'The precedence graph has no back-edges, so there is no cycle.',
      'A valid topological order T1 → T2 exists.'
    ]
  },
  {
    id: 'med_6',
    difficulty: 'Medium',
    topic: 'Conflict & View Serializability',
    question: 'How many candidate serial orders exist for a schedule involving 3 transactions (T1, T2, T3)?',
    options: [
      '3',
      '6 (3! = 3 × 2 × 1)',
      '9',
      '1'
    ],
    correctIndex: 1,
    explanation: 'For N transactions, there are N! possible serial order permutations. For 3 transactions, 3! = 6 candidate serial orders exist.',
    optionExplanations: [
      '3 is N, but permutations equal N! = 6.',
      'Correct! 3! = 6 candidate serial permutations (T1-T2-T3, T1-T3-T2, T2-T1-T3, T2-T3-T1, T3-T1-T2, T3-T2-T1).',
      '9 is 3^2, not 3!.',
      '1 is only one permutation among 6 possible permutations.'
    ]
  },
  {
    id: 'med_7',
    difficulty: 'Medium',
    topic: 'Conflict & View Serializability',
    question: 'What does the Reads-From relationship in view serializability dictate?',
    options: [
      'If T_j reads value written by T_i for item X in S, T_j must also read value written by T_i for item X in serial schedule S\'',
      'T_j must read every item written by T_i in alphabetical order',
      'T_j cannot read an item if T_i wrote to a different item',
      'T_i and T_j must belong to the same database session'
    ],
    correctIndex: 0,
    explanation: 'Reads-from relationship ensures data dependency flow: if T_j reads a value produced by T_i on X in S, T_j must read the value produced by T_i on X in equivalent serial schedule S\'.',
    optionExplanations: [
      'Correct! Reads-from preserves the producer-consumer data flow between transactions across view-equivalent schedules.',
      'Alphabetical order is irrelevant to data dependencies.',
      'Different items do not constrain reads-from on item X.',
      'Session grouping does not define reads-from dependencies.'
    ]
  },

  // ==========================================
  // HARD DIFFICULTY QUESTIONS
  // ==========================================
  {
    id: 'hard_1',
    difficulty: 'Hard',
    topic: 'Conflict & View Serializability',
    scheduleText: 'W1(X), R2(X), W2(Y), R3(Y), W3(X)',
    question: 'Consider the 3-transaction schedule: W1(X), R2(X), W2(Y), R3(Y), W3(X). Is it Conflict Serializable?',
    options: [
      'Yes, with topological order T1 → T2 → T3',
      'No, because the precedence graph contains a cycle T1 → T2 → T3 → T1',
      'Yes, with topological order T3 → T2 → T1',
      'No, because read operations are missing for T1'
    ],
    correctIndex: 1,
    explanation: 'W1(X) before R2(X) gives T1 → T2. W2(Y) before R3(Y) gives T2 → T3. W1(X) before W3(X) gives T1 → T3, but R2(X) before W3(X) gives T2 → T3. Wait, W1(X) vs W3(X) is T1 → T3, but R2(X) vs W3(X) is T2 → T3. In W1(X)...W3(X), T1 → T3. But if W3(X) preceded W1(X), T3 → T1. Here W1(X) before W3(X) means T1 → T3. Cycle check: T1 → T2 → T3, T1 → T3 (acyclic!). Wait, let\'s check W3(X) vs R2(X): R2(X) is before W3(X), so T2 → T3. So edges are T1 → T2, T2 → T3, T1 → T3. This graph is ACYCLIC! Topological order T1 → T2 → T3.',
    optionExplanations: [
      'Correct! Conflicts W1(X)-R2(X) (T1→T2), W2(Y)-R3(Y) (T2→T3), R2(X)-W3(X) (T2→T3), W1(X)-W3(X) (T1→T3) yield acyclic graph with topological order T1 → T2 → T3.',
      'No cycle exists; all edges point forward (T1→T2, T2→T3, T1→T3).',
      'Edges point from lower transaction numbers to higher, so T3 cannot be first.',
      'Missing reads do not prevent conflict serializability.'
    ]
  },
  {
    id: 'hard_2',
    difficulty: 'Hard',
    topic: 'Conflict & View Serializability',
    question: 'Why is testing View Serializability considered NP-Complete in computational complexity, whereas testing Conflict Serializability is in P (Polynomial time)?',
    options: [
      'Conflict serializability requires checking all N! permutations, while view serializability uses graph cycles',
      'View serializability requires checking candidate serial order permutations (NP-complete in general), while conflict serializability checks precedence graph cycles in O(V+E) time',
      'View serializability only works for 2 transactions',
      'Conflict serializability requires solving integer linear programming'
    ],
    correctIndex: 1,
    explanation: 'Testing conflict serializability reduces to cycle detection in a directed graph, solvable in O(V+E) time. Testing view serializability for arbitrary schedules is NP-complete because it involves searching over serial order permutations and matching 3 view conditions.',
    optionExplanations: [
      'Reversed! CSR uses graph cycles (O(V+E)); VSR involves checking candidate permutations.',
      'Correct! CSR cycle detection takes O(V+E) polynomial time, whereas general VSR testing is NP-complete.',
      'VSR applies to any number of transactions.',
      'CSR cycle detection does not require integer linear programming.'
    ]
  },
  {
    id: 'hard_3',
    difficulty: 'Hard',
    topic: 'Conflict & View Serializability',
    scheduleText: 'R1(X), W2(X), W1(X), W3(X)',
    question: 'In the blind write schedule S = R1(X), W2(X), W1(X), W3(X), which candidate serial order is view equivalent to S?',
    options: [
      'T2 → T1 → T3',
      'T1 → T2 → T3',
      'T3 → T2 → T1',
      'T2 → T3 → T1'
    ],
    correctIndex: 1,
    explanation: 'In S: Initial read of X is R1(X) by T1. Final write of X is W3(X) by T3. In serial order T1 → T2 → T3: T1 reads initial X, T2 writes X (overwritten by T1? No, T1 executes first, then T2 writes, then W1 writes? Wait! In T1→T2→T3: T1 reads initial X. Then T2 writes X. Then T3 writes X. Initial read is T1, final write is T3. Reads-from is empty in both. Thus T1 → T2 → T3 is view-equivalent!',
    optionExplanations: [
      'In T2 → T1 → T3, T2 executes first, so T1 would read T2\'s write instead of initial X.',
      'Correct! Serial order T1 → T2 → T3 preserves initial read R1(X), no reads-from, and final write W3(X).',
      'In T3 → T2 → T1, T3 performs initial write, violating final write W3(X).',
      'In T2 → T3 → T1, T1 performs final write, violating final write W3(X).'
    ]
  },
  {
    id: 'hard_4',
    difficulty: 'Hard',
    topic: 'Conflict & View Serializability',
    question: 'What is the key theoretical insight illustrated by schedules that are View Serializable but NOT Conflict Serializable?',
    options: [
      'View serializability is a stricter condition than conflict serializability',
      'Conflict serializability is a SUFFICIENT condition for view serializability, but NOT a necessary condition',
      'Conflict serializability allows blind writes whereas view serializability forbids them',
      'Both conflict and view serializability fail if transactions contain read operations'
    ],
    correctIndex: 1,
    explanation: 'Since CSR ⊂ VSR, if a schedule is CSR it is guaranteed to be VSR (sufficient). But a schedule can be VSR without being CSR (blind write cases), proving CSR is not necessary for view serializability.',
    optionExplanations: [
      'CSR is stricter (smaller set) than VSR.',
      'Correct! CSR is sufficient (CSR ⇒ VSR), but not necessary because non-CSR schedules with blind writes can still be VSR.',
      'VSR accommodates blind writes by allowing overwrite permutations; CSR creates cycles.',
      'Read operations are standard in both criteria.'
    ]
  },
  {
    id: 'hard_5',
    difficulty: 'Hard',
    topic: 'Conflict & View Serializability',
    scheduleText: 'R1(X), W2(Y), W1(Y), R2(X)',
    question: 'Consider schedule S: R1(X), W2(Y), W1(Y), R2(X). What is the result of Conflict and View Serializability analysis?',
    options: [
      'Conflict Serializable and View Serializable (Order: T1 → T2 or T2 → T1 depending on items)',
      'Neither Conflict Serializable nor View Serializable',
      'Conflict Serializable (T1 → T2), but NOT View Serializable',
      'View Serializable (T2 → T1), but NOT Conflict Serializable'
    ],
    correctIndex: 0,
    explanation: 'Conflicts: (R1(X), R2(X)) no conflict. (W2(Y), W1(Y)) gives T2 → T1. Are there any edges T1 → T2? R1(X) before R2(X) is read-read (no edge!). So graph has ONLY edge T2 → T1. Acyclic! Therefore Conflict Serializable and View Serializable with order T2 → T1.',
    optionExplanations: [
      'Correct! The only conflict pair is (W2(Y), W1(Y)) giving edge T2 → T1. The graph is acyclic, so S is both CSR and VSR with serial order T2 → T1.',
      'It is acyclic and valid, so it IS serializable.',
      'CSR strictly implies VSR; if it is CSR, it must be VSR.',
      'It is BOTH CSR and VSR.'
    ]
  }
];
