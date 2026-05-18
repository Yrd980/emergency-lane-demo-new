# Separate Incident Review From Response Task

Aegis Traffic treats **Incident Review** and **Response Task** as separate domain concepts. Although the current implementation has used one `review_status` flow for pending review, validation, dispatch, acceptance, and completion, that mixes human evidence judgment with field-response work; separating them preserves a clear boundary between deciding whether a **Suspected Incident** is actionable and tracking any work assigned after that decision.

**Consequences**

Future schema, API, and UI changes should avoid adding task lifecycle states to incident review state. A **Validated Incident** may exist without a **Response Task**, and a **Response Task** should carry its own assignment, acceptance, completion, or cancellation state.

Legacy incident review rows that used `assigned`, `accepted`, or `completed` are migrated to `validated`, because those states meant the suspected incident had already become actionable. The task lifecycle remains available on `dispatch_tasks.status`; incident list filters and review history constraints only admit review lifecycle values.
