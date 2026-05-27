# Aegis Traffic Web Frontend

This is the Web operations console for Aegis Traffic. It supports local monitoring, suspected incident review, evidence inspection, device health, runtime settings, and response task dispatch.

## Project Role

Aegis Traffic is a three-surface product:

- `frontend/`: Web operations console.
- `backend/`: Local API, database, evidence storage, auth, settings, devices, suspected incidents, and response tasks.
- `android/`: Android capture and patrol app.

The Web frontend should use the shared domain language in `../CONTEXT.md` and the product/design context in `../PRODUCT.md` and `../DESIGN.md`.

## Development

Use Bun for JavaScript and TypeScript work.

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

## Domain Language

Prefer these UI terms:

- **Suspected Incident** for road-side detections awaiting review.
- **Incident Review** for the human decision to validate or reject a suspected incident.
- **Evidence Set** for media used during review.
- **Complete Evidence Set** for before, peak, and after frames.
- **Review Priority** for queue ordering.
- **Response Task** for field work assigned after validation.

Avoid UI copy that implies legal adjudication, automatic enforcement, or confirmed violations.

Incident log filters should expose only incident review states: pending, validated, false alarm, and closed. Assigned, accepted, completed, and cancelled belong to response task UI.
