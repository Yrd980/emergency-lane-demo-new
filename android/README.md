# Aegis Traffic Android App

This is the Android capture and patrol surface for Aegis Traffic. It handles device registration, camera detection, ROI calibration, local suspected incident queues, evidence upload, and assigned response tasks for patrol users.

## Project Role

Aegis Traffic is a three-surface product:

- `frontend/`: Web operations console.
- `backend/`: Local API, database, evidence storage, auth, settings, devices, suspected incidents, and response tasks.
- `android/`: Android capture and patrol app.

The Android app coordinates with the backend through suspected incident uploads, evidence sets, device heartbeats, and response task sync. Use the shared domain language in `../CONTEXT.md`; use `../CONTEXT-MAP.md` for how the three surfaces relate.

## Development

Use the Gradle wrapper from this directory.

```bash
./gradlew assembleDebug
```

## Tests

```bash
./gradlew test
```

## Domain Language

Prefer these UI and data terms in new work:

- **Suspected Incident** for local detections queued for upload.
- **Evidence Set** for captured before, peak, and after frames.
- **Complete Evidence Set** for before, peak, and after frames.
- **Response Task** for patrol work assigned from the Web console.
- **Review Priority** for backend-provided queue ordering.

Avoid UI copy that implies legal adjudication, automatic enforcement, or confirmed violations. The app may capture detections and complete response tasks, but incident review remains a human workflow in the shared product context.
