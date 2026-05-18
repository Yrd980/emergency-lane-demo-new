# Aegis Traffic Backend

This is the local backend for Aegis Traffic. It provides the API, database access, evidence storage, authentication, runtime settings, device state, suspected incident review, and response task workflows.

## Project Role

Aegis Traffic is a three-surface product:

- `frontend/`: Web operations console.
- `backend/`: Local API, database, evidence storage, auth, settings, devices, suspected incidents, and response tasks.
- `android/`: Android capture and patrol app.

The backend owns persistence and workflow rules for the shared product context. Use the shared domain language in `../CONTEXT.md`; use `../CONTEXT-MAP.md` for how the three surfaces relate.

## Development

Use uv for Python work.

```bash
uv sync
uv run uvicorn app.main:app --reload
```

The existing helper can also be used:

```bash
./start.sh
```

## Tests

```bash
uv run pytest
```

## Domain Language

Prefer these API and model terms in new work:

- **Suspected Incident** for road-side detections awaiting review.
- **Incident Review** for the human decision to validate or reject a suspected incident.
- **Evidence Set** for media used during review.
- **Complete Evidence Set** for before, peak, and after frames.
- **Review Priority** for queue ordering.
- **Response Task** for field work assigned after validation.

Avoid adding response task lifecycle states to incident review state. New backend changes should preserve the boundary recorded in `../docs/adr/0001-separate-incident-review-from-response-task.md`.

Incident review persistence only admits `pending`, `validated`, `false_alarm`, and `closed`. Response task states live on `dispatch_tasks.status`; legacy incident review rows that contain task states are migrated to `validated` during database initialization.
