import React, { useState } from 'react';
import { BookOpen, Search, CheckCircle2 } from 'lucide-react';

export interface TheoryTopic {
  id: string;
  title: string;
  category: string;
  definition: string;
  example: string;
  whyItMatters: string;
  keyRule: string;
}

export const THEORY_TOPICS: TheoryTopic[] = [
  {
    id: 't-1',
    title: '1. What is a Transaction?',
    category: 'Foundations',
    definition: 'A DBMS transaction is a logical unit of database processing that includes one or more database operations (READ, WRITE, COMMIT, ABORT). Transactions must satisfy ACID properties (Atomicity, Consistency, Isolation, Durability).',
    example: 'T1: R1(X), W1(X), Commit1 (e.g. Transferring $100 from Account X)',
    whyItMatters: 'Guarantees database consistency despite concurrent operations and hardware failures.',
    keyRule: 'Operations inside a single transaction must execute in exact specified sequence.'
  },
  {
    id: 't-2',
    title: '2. What is a Schedule?',
    category: 'Foundations',
    definition: 'A schedule (or execution trace) represents the chronological sequence of interleaved operations from multiple concurrent transactions.',
    example: 'S = R1(X), W2(Y), R2(X), W1(Y)',
    whyItMatters: 'Captures actual execution order across concurrent processes.',
    keyRule: 'Order of operations within each individual transaction must be preserved.'
  },
  {
    id: 't-3',
    title: '3. Serial Schedule',
    category: 'Foundations',
    definition: 'A schedule where operations of each transaction execute completely from start to finish without interleaving with any other transaction.',
    example: 'S_serial = [T1 operations] followed by [T2 operations]',
    whyItMatters: 'Serial schedules are naturally consistent and isolated, but provide zero concurrency throughput.',
    keyRule: 'Zero interleaving between different transactions.'
  },
  {
    id: 't-4',
    title: '4. Non-Serial Schedule',
    category: 'Foundations',
    definition: 'A schedule where operations of different transactions interleave in time.',
    example: 'S_interleaved = R1(X), R2(Y), W1(X), W2(Y)',
    whyItMatters: 'Maximizes CPU and I/O utilization, but risks concurrency anomalies if unmanaged.',
    keyRule: 'Requires concurrency control mechanisms to ensure serializability.'
  },
  {
    id: 't-5',
    title: '5. Concept of Serializability',
    category: 'Serializability',
    definition: 'A non-serial schedule is serializable if its execution outcome is equivalent to SOME serial schedule of the same transactions.',
    example: 'S is equivalent to serial order T1 → T2.',
    whyItMatters: 'The gold standard criterion for database concurrency control.',
    keyRule: 'Allows performance gains of interleaving while guaranteeing correctness.'
  },
  {
    id: 't-6',
    title: '6. Conflict Serializability',
    category: 'Serializability',
    definition: 'A schedule is Conflict Serializable if it can be transformed into a serial schedule by repeatedly swapping non-conflicting adjacent operations.',
    example: 'Swapping R1(X) and R2(Y) does not change database state.',
    whyItMatters: 'Can be efficiently tested in O(V + E) time using a precedence graph cycle detector.',
    keyRule: 'Acyclic Precedence Graph ⟺ Conflict Serializable.'
  },
  {
    id: 't-7',
    title: '7. Conflicting Operations',
    category: 'Conflict Analysis',
    definition: 'Two operations in a schedule conflict if and only if: 1. They belong to different transactions, 2. They access the same data item, 3. At least one operation is a WRITE.',
    example: 'R1(X) vs W2(X) (READ-WRITE), W1(X) vs R2(X) (WRITE-READ), W1(X) vs W2(X) (WRITE-WRITE)',
    whyItMatters: 'Forms the edges of the precedence graph.',
    keyRule: 'READ-READ operations NEVER conflict.'
  },
  {
    id: 't-8',
    title: '8. Precedence Graph (Serialization Graph)',
    category: 'Conflict Analysis',
    definition: 'A directed graph G = (V, E) where nodes V are transactions and directed edge Ti → Tj indicates that an operation of Ti conflicts with and precedes an operation of Tj.',
    example: 'If R1(X) occurs before W2(X), add directed edge T1 → T2.',
    whyItMatters: 'Provides a visual and mathematical representation of precedence constraints.',
    keyRule: 'Graph edges capture all ordering dependencies between transactions.'
  },
  {
    id: 't-9',
    title: '9. Cycle Detection',
    category: 'Conflict Analysis',
    definition: 'Testing whether the precedence graph contains a directed cycle (e.g. T1 → T2 → T1).',
    example: 'R1(X), W2(X), W1(X) creates T1 → T2 and T2 → T1 (Cycle).',
    whyItMatters: 'A directed cycle implies circular dependency, rendering the schedule non-conflict-serializable.',
    keyRule: 'Implemented via DFS back-edge detection or Kahn\'s algorithm.'
  },
  {
    id: 't-10',
    title: '10. Topological Sorting',
    category: 'Conflict Analysis',
    definition: 'An ordering of graph vertices such that for every directed edge Ti → Tj, Ti comes before Tj.',
    example: 'For graph with edges T1 → T2 and T2 → T3, topological order is T1 → T2 → T3.',
    whyItMatters: 'Yields the exact equivalent serial transaction execution order for acyclic schedules.',
    keyRule: 'Acyclic graphs have at least one valid topological sort.'
  },
  {
    id: 't-11',
    title: '11. View Serializability',
    category: 'View Analysis',
    definition: 'A schedule S is View Serializable if it is view equivalent to at least one serial schedule S\'.',
    example: 'S matches candidate serial schedule T1 → T2 → T3 under initial reads, reads-from, and final writes.',
    whyItMatters: 'More general than conflict serializability; accepts valid schedules that conflict analysis rejects.',
    keyRule: 'Every conflict serializable schedule is view serializable, but not vice-versa.'
  },
  {
    id: 't-12',
    title: '12. Initial Reads Condition',
    category: 'View Analysis',
    definition: 'If an operation Ri(X) in original schedule S reads the initial value of X, then in candidate serial schedule S\', Ti must also read the initial value of X.',
    example: 'If T1 reads X before any transaction writes X, T1 must run before any writer of X in S\'.',
    whyItMatters: 'Ensures transactions receive initial database state consistently.',
    keyRule: 'First reader on item X must remain first reader on item X.'
  },
  {
    id: 't-13',
    title: '13. Reads-From Condition',
    category: 'View Analysis',
    definition: 'If Ri(X) in schedule S reads the value produced by write Wj(X), then in candidate serial schedule S\', Ri(X) must also read from Wj(X).',
    example: 'R2(X) reading value written by T1 must read from T1 in candidate serial order.',
    whyItMatters: 'Preserves data flow dependencies between transactions.',
    keyRule: 'Data dependencies must be identical across equivalent schedules.'
  },
  {
    id: 't-14',
    title: '14. Final Writes Condition',
    category: 'View Analysis',
    definition: 'For each data item X, the transaction Tj that performs the LAST write on X in schedule S must also perform the LAST write on X in candidate serial schedule S\'.',
    example: 'If T3 performs the final write on X, T3 must perform the final write on X in S\'.',
    whyItMatters: 'Guarantees final database state remains identical after completion.',
    keyRule: 'Final database state on every item X must match.'
  },
  {
    id: 't-15',
    title: '15. Blind Writes',
    category: 'Advanced Cases',
    definition: 'A WRITE operation performed by a transaction without previously reading the data item (e.g. W1(X) without R1(X)).',
    example: 'S = R1(X), W2(X), W1(X), W3(X)',
    whyItMatters: 'Blind writes allow a schedule to be View Serializable even when its precedence graph contains a cycle!',
    keyRule: 'Blind writes decouple read dependencies from write overwrites.'
  },
  {
    id: 't-16',
    title: '16. Conflict vs View Serializability',
    category: 'Comparison',
    definition: 'Conflict Serializability is a stricter, computationally fast subset of View Serializability.',
    example: 'Conflict testing is O(V+E); View testing is NP-complete in general (O(N!) exhaustive).',
    whyItMatters: 'Real-world DBMS engines use Conflict Serializability (Strict 2PL) due to polynomial efficiency.',
    keyRule: 'Conflict Serializable ⊂ View Serializable.'
  }
];

export const Learn: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredTopics = THEORY_TOPICS.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.definition.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Interactive DBMS Serializability Theory Guide
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Comprehensive university-level theory reference & core concepts</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search theory topics..."
            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid of Theory Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTopics.map((t) => (
          <div
            key={t.id}
            className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 shadow-sm hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                {t.category}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{t.definition}</p>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Example:</span>
              <code className="text-xs font-mono text-amber-700 dark:text-amber-300 font-bold">{t.example}</code>
            </div>

            <div className="flex flex-col gap-1 pt-1 text-xs">
              <span className="text-slate-500 font-semibold">Why It Matters:</span>
              <p className="text-slate-700 dark:text-slate-300">{t.whyItMatters}</p>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Key Rule: {t.keyRule}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
