# Conflict & View Serializability Analyzer - Architecture Specification

## Overview

The Conflict & View Serializability Analyzer is an interactive DBMS intelligence platform designed for students, researchers, and instructors. It performs deterministic dual-engine analysis of database transaction schedules.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             REACT FRONTEND (Vite)                           │
│  - Schedule Editor (Text/Table)     - Interactive Timeline                  │
│  - Cytoscape.js Precedence Graph    - View Equivalence Flow Diagram         │
│  - Algorithm Stepper & Simulation    - AI Tutor Drawer                       │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ REST API (JSON)
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                             FASTAPI BACKEND ENGINE                          │
│                                                                             │
│  ┌───────────────────────┐   ┌───────────────────────────────────────────┐  │
│  │ Schedule Parser        │   │ Unified Analyzer Orchestrator             │  │
│  │ Schedule Validator     │   └─────────────────────┬─────────────────────┘  │
│  └───────────────────────┘                         │                        │
│                                                     │                        │
│             ┌───────────────────────────────────────┴───────────────────────┐│
│             │                                                               ││
│  ┌──────────▼──────────────────────────┐     ┌──────────────────────────────▼──┐│
│  │ Conflict Serializability Engine     │     │ View Serializability Engine     ││
│  │ - Conflict Pair Detection (RW,WR,WW)│     │ - Initial Reads Analysis        ││
│  │ - Precedence Graph Construction     │     │ - Reads-From Relationships      ││
│  │ - Cycle Detection (DFS / Tarjan)    │     │ - Final Writes Identification   ││
│  │ - Topological Order Generator       │     │ - Exhaustive Permutation Check  ││
│  └─────────────────────────────────────┘     └─────────────────────────────────┘│
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                         SQLITE PERSISTENCE & SERVICES                       │
│  - Analysis History Database       - ReportLab PDF Report Generator         │
│  - Structured AI Tutor Service      - JSON & CSV Data Exporters             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Architectural Principles

1. **Deterministic Backend Source of Truth**: Backend Python algorithms strictly calculate all graph nodes, edges, cycles, initial reads, reads-from, final writes, and view equivalence. AI is restricted to explaining computed outputs.
2. **Unified Analysis Controller**: Single `analyze_schedule()` execution evaluates BOTH engines simultaneously for every schedule input.
3. **Decoupled API & Presentation**: Pure JSON API enables standalone CLI, web, or automated grading integration.
