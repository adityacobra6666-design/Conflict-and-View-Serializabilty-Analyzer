# User Manual - Conflict & View Serializability Analyzer

## Getting Started

1. Open the application dashboard in your browser (`http://localhost:5173`).
2. Click **"Start Analyzing"** or navigate to the **Analyzer** tab.
3. Enter your schedule string in **Text Mode** (e.g. `R1(X), W2(X), W1(X), W3(X)`) or use **Visual Table Mode** to add operations row-by-row.
4. Click **"Analyze Schedule"**.

## Exploring Visualizations

- **Timeline View**: Chronological execution matrix. Click any operation to inspect transaction, position, and conflicting operations.
- **Precedence Graph**: Directed dependency graph rendered with Cytoscape.js. Click directed edges to view underlying conflict causes.
- **Conflict Analysis**: Detailed breakdown table of READ-WRITE, WRITE-READ, and WRITE-WRITE pairs.
- **View Analysis**: Step-by-step pipeline checking initial reads, reads-from, and final write conditions across candidate serial permutations.
- **Comparison Summary**: Unified verdict comparing Conflict vs View serializability results with interactive "Why?" drawers.

## Using AI Tutor & Reports

- Click **"AI Tutor"** in the top navigation bar to open the AI assistant drawer. Select prompt presets like *Explain Result*, *ELI5 Beginner*, or *Viva Questions*.
- Click **"Export Report"** in the Analyzer toolbar to download PDF, JSON, or CSV analysis files.
