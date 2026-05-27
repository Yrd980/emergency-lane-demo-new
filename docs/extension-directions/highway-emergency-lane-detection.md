# Highway Emergency-Lane Detection Extension

## Direction

This extension direction targets highway emergency-lane detection where many roadside or patrol Android devices may operate across longer road segments, weaker networks, and faster operational response windows.

The current product loop remains the baseline:

- Android devices create **Suspected Incidents** and upload **Evidence Sets**.
- The backend remains the system of record for persistence, review state, evidence metadata, device state, users, and **Response Tasks**.
- The Web frontend remains the operations console for **Incident Review**, device health, settings, and dispatch.

## MQTT As An Optional Side Channel

MQTT can be introduced later as a lightweight publish/subscribe side channel for real-time highway operations. It should not replace the existing REST API for business writes.

Use MQTT for:

- Device heartbeat and near-real-time online/offline telemetry.
- FPS, battery, thermal state, model version, and upload backlog updates.
- Backend-to-device notifications such as new response-task hints or configuration-change notices.
- Lightweight "wake up and sync" messages when the backend wants an Android device to pull fresh state.

Do not use MQTT for:

- Uploading evidence images or video clips.
- Creating the authoritative **Suspected Incident** record.
- Persisting **Incident Review** outcomes.
- Creating, accepting, or completing **Response Tasks**.
- Replacing backend-owned audit history.

REST remains authoritative because suspected incidents, evidence sets, review decisions, and response tasks require durable writes, clear error handling, and auditable state transitions.

## Proposed Topic Shape

Initial topic names should stay operational and device-scoped:

- `aegis/highway/devices/{device_id}/heartbeat`
- `aegis/highway/devices/{device_id}/metrics`
- `aegis/highway/devices/{device_id}/upload-backlog`
- `aegis/highway/devices/{device_id}/sync-request`
- `aegis/highway/tasks/{device_id}/assigned`
- `aegis/highway/system/health`

Payloads should use the same field names as the existing HTTP API where possible, such as `device_id`, `fps`, `thermal_state`, `pending_upload_count`, `task_id`, and `suspected_incident_id`.

## Delivery Flow

1. Android publishes heartbeat and metrics to MQTT when connected.
2. Backend subscribes and updates the existing device tables or metric history.
3. Backend publishes a lightweight task notification when a **Response Task** is assigned.
4. Android receives the notification and still calls the REST task endpoint to fetch authoritative details.
5. Android continues to upload **Suspected Incidents** and **Evidence Sets** through REST.

This keeps the product resilient: missed MQTT messages only delay awareness, while the backend database and REST APIs preserve the source of truth.

## Open Decisions

- Broker choice: embedded local broker, Mosquitto, EMQX, or another deployment option.
- Authentication model: per-device credentials, short-lived tokens, or broker ACLs mapped from backend device registration.
- QoS policy for each topic class.
- Retained-message use for last-known device status.
- Whether MQTT should be enabled by runtime setting, environment variable, or deployment profile.
- How Web should subscribe to live device state, if at all, versus continuing to poll backend REST endpoints.

## References

- MQTT overview: https://mqtt.org/faq/
- MQTT v5.0 specification: https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html
