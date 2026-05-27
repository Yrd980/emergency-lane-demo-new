# Aegis Traffic

Aegis Traffic is a local emergency-lane detection and review context. It connects suspected emergency-lane occupation, evidence review, and response work without implying automatic enforcement.

## Language

**Suspected Incident**:
A road-side detection that may represent emergency-lane occupation and requires evidence-based review.
_Avoid_: violation, case, event

**Incident Review**:
The human judgment of whether a **Suspected Incident** is trustworthy enough to act on.
_Avoid_: dispatch status, task status

**Incident Review State**:
The current review outcome for a **Suspected Incident**: pending, validated, false alarm, or closed.
_Avoid_: assigned, accepted, completed

**Response Task**:
Operational work assigned after a **Suspected Incident** is considered actionable.
_Avoid_: review status, incident status

**Validated Incident**:
A **Suspected Incident** that has passed **Incident Review**.
_Avoid_: confirmed violation, legal violation

**False Alarm**:
A **Suspected Incident** rejected during **Incident Review** because the evidence does not support action.
_Avoid_: failed event

**Evidence Set**:
The collected media used to review a **Suspected Incident**.
_Avoid_: attachment list

**Complete Evidence Set**:
An **Evidence Set** containing a before frame, peak frame, and after frame.
_Avoid_: video-required evidence

**Review Priority**:
The ordering signal used to decide which **Suspected Incidents** should be reviewed first.
_Avoid_: risk level, public safety risk

**High Priority**:
A **Review Priority** for a **Suspected Incident** with high confidence or long occupation duration.
_Avoid_: high risk

## Relationships

- A **Suspected Incident** has exactly one current **Incident Review** state.
- **Assigned**, **Accepted**, and **Completed** describe **Response Task** progress, not **Incident Review State**.
- A **Suspected Incident** has zero or one **Evidence Sets**.
- A **Validated Incident** may produce zero or one active **Response Tasks** when field action is needed.
- A **Response Task** belongs to exactly one **Validated Incident**.
- A **False Alarm** does not produce a **Response Task**.
- A **Complete Evidence Set** requires a before frame, peak frame, and after frame; video is supporting evidence only.
- A **Review Priority** belongs to a **Suspected Incident** until **Incident Review** no longer needs operator attention.

## Example dialogue

> **Dev:** "When a **Suspected Incident** is validated, is it completed?"
> **Domain expert:** "No. Validation completes the **Incident Review**; completion belongs to the **Response Task** after field work is done."

## Flagged ambiguities

- `review_status` has been used for both **Incident Review** and **Response Task** state. Resolved: these are distinct domain concepts.
- `assigned`, `accepted`, and `completed` have appeared in old incident review data. Resolved: they are task states; legacy incident review data maps them back to **Validated Incident**.
- "event", "case", and "violation" have all been used for the same core object. Resolved: the canonical domain term is **Suspected Incident** because the system has not made a legal judgment.
- "complete evidence" could imply video is mandatory. Resolved: **Complete Evidence Set** requires before, peak, and after frames; video is optional supporting evidence.
- `risk_level` has been used for review ordering. Resolved: the canonical domain term is **Review Priority** because the system is not assessing real-world public safety risk.
- "validated" could imply automatic dispatch. Resolved: a **Validated Incident** only produces a **Response Task** when field action is needed, and it should have at most one active **Response Task**.
