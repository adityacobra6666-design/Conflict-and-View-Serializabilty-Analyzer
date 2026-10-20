import json
import os
from app.algorithms.analyzer import analyze_schedule

def build_full_question_bank():
    questions = []
    q_id = 1

    # =========================================================================
    # PART 1: 50 SCHEDULES x 3 VARIANTS = 150 DETERMINISTICALLY VERIFIED QUESTIONS
    # =========================================================================
    schedules_data = [
        ("R1(X), W2(X), W1(X), W3(X)", "Hard", "View Serializability", "GATE CS"),
        ("R1(X), W2(X), R2(Y), W1(Y)", "Medium", "Conflict Serializability", "GATE CS"),
        ("R1(X), R2(X), W1(X), W2(X)", "Medium", "Conflict Serializability", "ISRO CS"),
        ("R1(X), W2(X), R3(X), W1(Y), W3(Y)", "Hard", "Precedence Graphs", "GATE CS"),
        ("R1(X), R2(X), R1(Y), R2(Y)", "Easy", "Conflict Serializability", "UGC NET"),
        ("W1(X), R2(X), W1(Y), R2(Y)", "Easy", "Conflict Serializability", "GATE CS"),
        ("R1(X), W2(X), R1(Y), W2(Y)", "Medium", "Conflict Serializability", "GATE CS"),
        ("R1(A), W2(A), R2(B), W1(B)", "Medium", "Conflict Serializability", "GATE CS"),
        ("R1(X), W1(X), R2(X), W2(X), R3(X), W3(X)", "Easy", "Conflict Serializability", "University DBMS Exam"),
        ("R2(X), W1(X), R1(X), W2(X)", "Medium", "Conflict Serializability", "GATE CS"),
        ("R1(X), W2(X), W1(Y), W2(Y)", "Easy", "Precedence Graphs", "UGC NET"),
        ("W1(X), W2(X), W3(X)", "Easy", "Conflict Serializability", "ISRO CS"),
        ("R1(A), R2(B), W1(A), W2(B), R1(B), W2(A)", "Hard", "Precedence Graphs", "GATE CS"),
        ("R1(X), W2(X), R3(Y), W1(Y), R2(Z), W3(Z)", "Hard", "Conflict Serializability", "GATE CS"),
        ("R1(X), W2(X), R2(X), W1(X)", "Medium", "Conflict Serializability", "ISRO CS"),
        ("R1(A), R2(A), W1(B), W2(B)", "Easy", "Conflict Serializability", "UGC NET"),
        ("W1(X), R2(X), R3(X), W1(Y), W2(Y)", "Medium", "Precedence Graphs", "GATE CS"),
        ("R1(X), W2(X), W3(X), R1(Y), W2(Y)", "Hard", "View Serializability", "GATE CS"),
        ("R1(X), W2(Y), R2(X), W1(Y)", "Medium", "Conflict Serializability", "ISRO CS"),
        ("R1(X), W2(X), R3(Y), W2(Y), W1(Z), R3(Z)", "Hard", "Precedence Graphs", "GATE CS"),
        ("R1(A), W2(A), R3(A), W1(A)", "Medium", "Conflict Serializability", "GATE CS"),
        ("R2(X), R3(X), W1(X), R2(Y), W3(Y)", "Medium", "Conflict Serializability", "GATE CS"),
        ("R1(X), W2(Y), W3(Z), R1(Y), W2(Z), R3(X)", "Hard", "Precedence Graphs", "GATE CS"),
        ("W1(A), R2(A), W2(B), R3(B), W3(C), R1(C)", "Hard", "Conflict Serializability", "GATE CS"),
        ("R1(X), W2(X), R3(X), W3(Y), W1(Y)", "Medium", "Conflict Serializability", "UGC NET"),
        ("R1(A), W2(B), R3(C), W1(C), R2(A), W3(B)", "Hard", "Precedence Graphs", "ISRO CS"),
        ("R1(X), W2(X), W3(X), W1(X)", "Medium", "View Serializability", "GATE CS"),
        ("R1(X), R2(Y), W1(Y), W2(X)", "Medium", "Conflict Serializability", "GATE CS"),
        ("R1(X), W2(X), R1(X), W2(Y), R1(Y)", "Medium", "Conflict Serializability", "University DBMS Exam"),
        ("W1(X), R2(X), W3(X)", "Easy", "Conflict Serializability", "UGC NET"),
        ("R1(A), W2(A), R3(B), W1(B), R2(C), W3(C)", "Hard", "Conflict Serializability", "GATE CS"),
        ("R1(X), W2(Y), R3(Z), W1(Z), R2(X), W3(Y)", "Hard", "Precedence Graphs", "GATE CS"),
        ("W1(X), W2(Y), R1(Y), R2(X)", "Medium", "Conflict Serializability", "ISRO CS"),
        ("R1(X), W2(X), R3(X), W4(X)", "Medium", "Conflict Serializability", "GATE CS"),
        ("R1(X), W1(X), R2(Y), W2(Y)", "Easy", "Conflict Serializability", "University DBMS Exam"),
        ("R1(A), R2(B), R3(C), W1(B), W2(C), W3(A)", "Hard", "Precedence Graphs", "GATE CS"),
        ("R1(X), W2(X), W3(Y), R1(Y), W2(Z), R3(Z)", "Hard", "Conflict Serializability", "GATE CS"),
        ("W1(A), W2(A), R1(A)", "Medium", "Conflict Serializability", "ISRO CS"),
        ("R1(X), W2(X), R3(Y), W1(Z), R2(Z), W3(Y)", "Hard", "Precedence Graphs", "GATE CS"),
        ("R1(X), W2(X), R1(Y), W3(Y), R2(Z), W3(Z)", "Hard", "Conflict Serializability", "GATE CS"),
        ("R1(X), W2(X), W1(X), R2(X)", "Medium", "Conflict Serializability", "GATE CS"),
        ("R1(A), W2(B), R3(A), W1(B), R2(A)", "Medium", "Conflict Serializability", "UGC NET"),
        ("R1(X), W1(Y), R2(Y), W2(Z), R3(Z), W3(X)", "Hard", "Precedence Graphs", "GATE CS"),
        ("W1(X), R2(Y), W2(X), R1(Y)", "Medium", "Conflict Serializability", "ISRO CS"),
        ("R1(X), W2(X), R3(X), W2(Y), W3(Y)", "Medium", "Conflict Serializability", "GATE CS"),
        ("R1(A), R2(A), R3(A), W1(A)", "Easy", "Conflict Serializability", "University DBMS Exam"),
        ("R1(X), W2(X), R3(Y), W1(Y), W2(Z), R3(Z)", "Hard", "Conflict Serializability", "GATE CS"),
        ("W1(X), W2(X), R3(X), W4(X)", "Medium", "View Serializability", "GATE CS"),
        ("R1(X), W2(Y), R2(Z), W3(X), R3(Y), W1(Z)", "Hard", "Precedence Graphs", "GATE CS"),
        ("R1(X), W2(X), R3(X), W1(X), W3(X)", "Hard", "View Serializability", "GATE CS")
    ]

    for sched_str, diff, topic, exam in schedules_data:
        res = analyze_schedule(sched_str)
        is_conflict = res["conflict_serializable"]
        is_view = res["view_serializable"]
        has_cycle = res["has_cycle"]
        cycles = res["formatted_cycles"]
        topos = res["formatted_topological_orders"]
        equiv_orders = res["view_analysis"]["equivalent_orders"]
        conflict_count = res["conflict_count"]

        # V1: Serializability verdict
        if is_conflict:
            c_ans = f"Conflict serializable with equivalent serial schedule {topos[0]}"
            w1 = "Not conflict serializable due to cyclic precedence graph"
            w2 = f"Conflict serializable with equivalent serial schedule {' → '.join(reversed(topos[0].split(' → ')))}"
            w3 = "Not serializable under either conflict or view serializability"
            exp = (f"Schedule S = {sched_str} has {conflict_count} conflicting operation pairs forming an acyclic "
                   f"precedence graph. Topological sorting produces the equivalent serial order: {topos[0]}. "
                   f"Thus S is Conflict Serializable.")
        else:
            cycle_str = cycles[0] if cycles else "directed cycle"
            c_ans = f"Not conflict serializable because precedence graph contains cycle ({cycle_str})"
            w1 = f"Conflict serializable with equivalent serial order {' → '.join(res['transactions'])}"
            w2 = "Conflict serializable because read operations precede writes"
            w3 = "Conflict serializable with acyclic dependency graph"
            exp = (f"Schedule S = {sched_str} is NOT conflict serializable because its precedence graph contains "
                   f"the directed cycle ({cycle_str}). {'However, view serializability holds due to blind writes.' if is_view else 'View serializability also fails.'}")

        questions.append({
            "id": f"comp_q_{q_id:03d}",
            "question": f"Given schedule S = {sched_str}, what is its conflict serializability status and equivalent serial execution order?",
            "scheduleText": sched_str,
            "options": [c_ans, w1, w2, w3],
            "correctIndex": 0,
            "explanation": exp,
            "difficulty": diff,
            "topic": "Conflict Serializability",
            "exam": exam
        })
        q_id += 1

        # V2: Precedence Graph
        if has_cycle:
            cycle_str = cycles[0] if cycles else "directed cycle"
            c_ans = f"Contains directed cycle ({cycle_str})"
            w1 = "Acyclic precedence graph allowing topological ordering"
            w2 = "Disconnected graph with no directed edges"
            w3 = "Complete bipartite graph with no cycles"
            exp = (f"In schedule S = {sched_str}, conflict relationships create directed dependencies "
                   f"that form the cycle ({cycle_str}). By the Serialization Theorem, a schedule is conflict "
                   f"serializable if and only if its precedence graph is acyclic.")
        else:
            c_ans = f"Acyclic precedence graph with valid topological order: {topos[0]}"
            w1 = f"Cyclic graph with cycle ({' → '.join(res['transactions'])} → {res['transactions'][0]})"
            w2 = "Graph has self-loops on transactions accessing the same item"
            w3 = "Graph has undirected conflict edges"
            exp = (f"For schedule S = {sched_str}, drawing directed edges Ti → Tj for every conflicting "
                   f"operation where Ti precedes Tj results in a directed acyclic graph (DAG) with topological order {topos[0]}.")

        questions.append({
            "id": f"comp_q_{q_id:03d}",
            "question": f"Examine the Precedence Graph generated for schedule S = {sched_str}:",
            "scheduleText": sched_str,
            "options": [w1, c_ans, w2, w3],
            "correctIndex": 1,
            "explanation": exp,
            "difficulty": "Medium" if diff == "Easy" else diff,
            "topic": "Precedence Graphs",
            "exam": exam
        })
        q_id += 1

        # V3: View Serializability & Equivalence
        if is_view and not is_conflict:
            c_ans = f"View serializable (equivalent to {equiv_orders[0]}), but NOT conflict serializable"
            w1 = "Both conflict serializable and view serializable"
            w2 = "Neither conflict serializable nor view serializable"
            w3 = "Conflict serializable but not view serializable"
            exp = (f"Schedule S = {sched_str} is View Serializable but NOT Conflict Serializable. "
                   f"Blind writes cause a cycle in the conflict graph, but serial order {equiv_orders[0]} "
                   f"preserves all Initial Reads, Reads-From relationships, and Final Writes.")
        elif is_view and is_conflict:
            c_ans = f"Both conflict serializable and view serializable (equivalent to {topos[0]})"
            w1 = "View serializable only, not conflict serializable"
            w2 = "Conflict serializable but fails view equivalence"
            w3 = "Neither conflict serializable nor view serializable"
            exp = (f"Conflict serializability mathematically implies view serializability (CS ⊂ VS). "
                   f"Since S = {sched_str} is conflict serializable with serial order {topos[0]}, it is also view serializable under {topos[0]}.")
        else:
            c_ans = "Neither conflict serializable nor view serializable"
            w1 = "View serializable because of blind writes"
            w2 = "Conflict serializable because operations commute"
            w3 = f"View serializable with serial order {' → '.join(res['transactions'])}"
            exp = (f"Schedule S = {sched_str} contains a cycle in its precedence graph, and none of the candidate "
                   f"serial permutations preserve initial reads, reads-from, and final writes. Thus it is neither CS nor VS.")

        questions.append({
            "id": f"comp_q_{q_id:03d}",
            "question": f"What is the complete dual-criteria serializability verdict (Conflict & View) for S = {sched_str}?",
            "scheduleText": sched_str,
            "options": [w1, w2, c_ans, w3],
            "correctIndex": 2,
            "explanation": exp,
            "difficulty": "Hard" if (is_view and not is_conflict) else diff,
            "topic": "View Serializability",
            "exam": exam
        })
        q_id += 1

    # Total so far: 150 questions!
    print(f"Generated {len(questions)} schedule-verified questions. Now adding domain conceptual questions...")

    # We will import the conceptual generator module to append remaining questions up to 500
    from app.scripts.conceptual_questions import get_all_conceptual_questions
    conceptual_qs = get_all_conceptual_questions(start_id=q_id)
    questions.extend(conceptual_qs)

    print(f"Total questions generated: {len(questions)}")
    
    # Save to frontend data directory
    out_path = os.path.abspath(os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "frontend", "src", "data", "competitiveQuestions.json"
    ))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2)

    print(f"Successfully saved {len(questions)} questions to {out_path}")
    return len(questions)

if __name__ == "__main__":
    build_full_question_bank()
