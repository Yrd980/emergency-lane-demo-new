# Context Map

## Contexts

- [Aegis Traffic](./CONTEXT.md) - shared product language for suspected incidents, incident review, evidence sets, review priority, and response tasks.

## Delivery Surfaces

- **Web frontend** (`frontend/`) - operations console for monitoring, incident review, evidence inspection, settings, device health, and response task dispatch.
- **Backend** (`backend/`) - local API and persistence for suspected incidents, evidence sets, runtime settings, device state, users, and response tasks.
- **Android app** (`android/`) - capture and patrol surface for device registration, camera detection, queued evidence upload, and response task execution.

## Relationships

- **Android app -> Backend**: uploads suspected incidents and evidence sets; syncs assigned response tasks.
- **Web frontend -> Backend**: reviews suspected incidents, inspects evidence sets, manages devices/settings, and dispatches response tasks.
- **Web frontend <-> Android app**: coordinate through backend-owned response tasks and shared IDs.

## Extension Directions

- [Highway Emergency-Lane Detection](./docs/extension-directions/highway-emergency-lane-detection.md) - future highway deployment direction, including MQTT as an optional real-time telemetry and notification side channel while REST remains authoritative for suspected incidents, evidence sets, incident review, and response tasks.
