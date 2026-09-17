# Testing & Quality Assurance Documentation

## Test Matrix Coverage

| Test Case | Schedule | Conflict | View | Description |
|---|---|---|---|---|
| Case A | R1(X), W1(X), R2(X), W2(X) | YES | YES | Standard serializable schedule |
| Case B | R1(X), W2(X), W1(X), W3(X) | NO | YES | Verified Blind-Write special case |
| Case C | R1(X), W2(X), W1(Y), R2(Y) | NO | NO | Cyclic non-serializable schedule |
| Case D | R1(X), W1(X), R2(Y), W2(Y) | YES | YES | Parallel independent transactions |
| Case E | R1(X), W2(X), R2(Y), W3(Y) | YES | YES | 3-Transaction chain dependency |

## Executing Test Suites

### Backend Pytest
```bash
cd backend
./venv/bin/pytest -v
```

### Frontend Vitest & TypeScript Build
```bash
cd frontend
npm run build
```
