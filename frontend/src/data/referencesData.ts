export interface ReferenceItem {
  id: string;
  title: string;
  authors?: string;
  publisher?: string;
  edition?: string;
  year?: string;
  venue?: string;
  url?: string;
  doi?: string;
  topic?: string;
  creator?: string;
  description?: string;
}

export interface ReferencesData {
  books: ReferenceItem[];
  websites: ReferenceItem[];
  researchPapers: ReferenceItem[];
  educationalResources: ReferenceItem[];
  videos: ReferenceItem[];
}

export const referencesData: ReferencesData = {
  books: [
    {
      id: "b1",
      title: "Database System Concepts",
      authors: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
      publisher: "McGraw-Hill Education",
      edition: "7th Edition",
      year: "2019",
      url: "https://www.db-book.com/",
      description: "Comprehensive textbook on DBMS architecture, transaction management, conflict serializability, and two-phase locking protocols."
    },
    {
      id: "b2",
      title: "Fundamentals of Database Systems",
      authors: "Ramez Elmasri, Shamkant B. Navathe",
      publisher: "Pearson",
      edition: "7th Edition",
      year: "2015",
      url: "https://www.pearson.com/",
      description: "Standard reference text covering concurrency control algorithms, precedence graphs, and view equivalence criteria."
    }
  ],
  websites: [
    {
      id: "w1",
      title: "PostgreSQL Documentation — Concurrency Control & Isolation Levels",
      creator: "PostgreSQL Global Development Group",
      url: "https://www.postgresql.org/docs/current/mvcc.html",
      year: "2024",
      description: "Official PostgreSQL documentation explaining multi-version concurrency control (MVCC) and transaction isolation."
    },
    {
      id: "w2",
      title: "Oracle Database Concepts — Data Concurrency and Consistency",
      creator: "Oracle Corporation",
      url: "https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/data-concurrency-and-consistency.html",
      year: "2023",
      description: "Oracle reference manual detailing transaction schedules, locking mechanisms, and serializability guarantees."
    },
    {
      id: "w3",
      title: "Microsoft Learn — SET TRANSACTION ISOLATION LEVEL",
      creator: "Microsoft Corporation",
      url: "https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql",
      year: "2024",
      description: "Technical specification of transaction isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable)."
    },
    {
      id: "w4",
      title: "GeeksforGeeks — Conflict Serializability in DBMS",
      creator: "GeeksforGeeks",
      url: "https://www.geeksforgeeks.org/conflict-serializability-in-dbms/",
      year: "2024",
      description: "Educational guide explaining conflict operations, precedence graph construction, and cycle detection."
    }
  ],
  researchPapers: [
    {
      id: "p1",
      title: "The Notions of Consistency and Predicate Locks in a Database System",
      authors: "K. P. Eswaran, J. N. Gray, R. A. Lorie, I. L. Traiger",
      venue: "Communications of the ACM (CACM)",
      year: "1976",
      doi: "10.1145/360363.360369",
      url: "https://dl.acm.org/doi/10.1145/360363.360369",
      description: "Seminal paper introducing transaction consistency definitions, conflict operations, and two-phase locking (2PL)."
    },
    {
      id: "p2",
      title: "Concurrency Control in Distributed Database Systems",
      authors: "Philip A. Bernstein, Nathan Goodman",
      venue: "ACM Computing Surveys (CSUR)",
      year: "1981",
      doi: "10.1145/356842.356846",
      url: "https://dl.acm.org/doi/10.1145/356842.356846",
      description: "Foundational survey establishing formal equivalence criteria for conflict and view serializability."
    },
    {
      id: "p3",
      title: "Testing and Recognizing Serializability of Database Schedules",
      authors: "Christos H. Papadimitriou",
      venue: "Journal of the ACM (JACM)",
      year: "1979",
      doi: "10.1145/322154.322158",
      url: "https://dl.acm.org/doi/10.1145/322154.322158",
      description: "Proves NP-completeness of View Serializability testing and polynomial time complexity of Conflict Serializability using precedence graphs."
    }
  ],
  educationalResources: [
    {
      id: "e1",
      title: "NPTEL — Database Management System",
      authors: "Prof. Partha Pratim Das",
      publisher: "IIT Kharagpur / NPTEL",
      topic: "Transactions, Concurrency Control, Conflict Serializability",
      url: "https://nptel.ac.in/courses/106105175",
      description: "National Programme on Technology Enhanced Learning course covering formal DBMS transaction theory."
    },
    {
      id: "e2",
      title: "MIT OpenCourseWare — 6.830 Database Systems",
      authors: "Prof. Samuel Madden",
      publisher: "Massachusetts Institute of Technology (MIT)",
      topic: "Transaction Management & Locking",
      url: "https://ocw.mit.edu/courses/6-830-database-systems-fall-2010/",
      description: "Open courseware lecture series on concurrency control architectures and serializability testing."
    },
    {
      id: "e3",
      title: "CMU 15-445/645 — Database Systems",
      authors: "Prof. Andy Pavlo",
      publisher: "Carnegie Mellon University (CMU)",
      topic: "Two-Phase Locking & Concurrency Control Protocols",
      url: "https://15445.courses.cs.cmu.edu/",
      description: "Carnegie Mellon course material on database internals, isolation levels, and serializability."
    }
  ],
  videos: [
    {
      id: "v1",
      title: "Database Management System : Conflict Serializability & Precedence Graph",
      creator: "Anindita Das Bhattacharjee",
      topic: "Conflict Serializability, Conflicting Operations & Precedence Graph",
      url: "https://www.youtube.com/watch?v=YM5XnU3Y3oY",
      description: "Video tutorial explaining conflict serializability rules and precedence graph construction."
    },
    {
      id: "v2",
      title: "Lec-99: Why View Serializability is Used | Introduction to View Serializability | DBMS",
      creator: "Gate Smashers",
      topic: "Introduction to View Serializability",
      url: "https://www.youtube.com/watch?v=8LKM_RWeroM",
      description: "Video explaining the necessity of view serializability and view equivalence criteria."
    },
    {
      id: "v3",
      title: "DBMS 29: Part 3: Learn View Serializability with Solved Examples | Transactions",
      creator: "CS & IT Tutorials by Vrushali",
      topic: "View Serializability with Solved Examples",
      url: "https://www.youtube.com/watch?v=R8ROrNkolWw",
      description: "Step-by-step video lecture solving view serializability candidate order problems."
    }
  ]
};
