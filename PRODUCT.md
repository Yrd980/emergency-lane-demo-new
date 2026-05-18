# Product

## Register

product

## Users

Aegis Traffic serves traffic-operations teams who need to detect, review, and respond to suspected emergency-lane occupation in a local or controlled deployment.

The durable user groups are operators who keep the system running, reviewers who decide whether an evidence set is trustworthy, coordinators who route response work, and field users who act on assigned response tasks. These may map to different product roles over time, but their jobs remain stable.

The use context is practical and time-sensitive. Users need to know whether the detection loop is healthy, whether the evidence set is complete enough to trust, which suspected incidents require human review, and what action should happen next. The interface can feel like a traffic operations console, but it must remain honest about the deployment boundary and the capabilities actually present.

## Product Purpose

Aegis Traffic is an emergency-lane detection and review workbench. It turns road-side detections into suspected incidents by connecting capture, evidence sets, system health, human judgment, operational history, and response tasks into one loop.

The product exists to close the loop from detection to human decision: receive suspected incidents, show the evidence and context required to validate or reject them, surface system problems that affect reliability, and route validated incidents to the right next action when field response is needed.

Success means a user can answer five questions quickly on any screen: is the system healthy, is the evidence set complete, what needs incident review, what has already happened, and what response task should happen next.

## Three-Surface Product Shape

Aegis Traffic is delivered through three coordinated surfaces:

- **Web frontend**: the operations console for monitoring, incident review, evidence inspection, settings, device health, and response task dispatch.
- **Backend**: the local API and persistence layer for suspected incidents, evidence sets, runtime settings, device state, users, and response tasks.
- **Android app**: the field and capture surface for device registration, camera detection, queued evidence upload, and patrol response tasks.

These are delivery surfaces for one product context, not separate domain contexts. They should share the same language from `CONTEXT.md`.

## Brand Personality

Precise, vigilant, controlled.

The interface should feel like a high-performance operations instrument: technically advanced, serious about public safety, and calm under pressure. It can feel futuristic through precision, contrast, and instrumentation, but it should never become a decorative "command center" skin that competes with evidence, status, and review actions.

The voice is terse and operational. Labels should be concrete, verb-led, and tied to the next decision. Avoid marketing copy and avoid over-explaining controls inside the product.

## Anti-references

Do not make it look like a landing page, SaaS marketing dashboard, generic admin template, cyberpunk control-room poster, decorative smart-city demo, or a production law-enforcement platform that hides its constraints.

Avoid fake drama: oversized hero claims, glowing ornament, excessive glass effects, repeated metric cards without workflow value, decorative maps, and alert colors used as decoration. Avoid implying automatic enforcement, legal adjudication, external integrations, or availability guarantees unless the product actually supports them.

## Design Principles

1. Close the loop: capture, evidence, system health, incident review, history, and response tasks should feel connected rather than like separate tools.
2. Evidence before decoration: media, detection metadata, time, location, confidence, history, and state must carry the interface.
3. Action follows state: empty, loading, error, pending, degraded, complete, and resolved states should all point to a useful next step.
4. Preserve operational rhythm: monitoring, review, detail, history, health, settings, setup, and field workflows should share severity language and status behavior.
5. Priority is explicit: review priority, health, assignment, completion, and failure states must use text, iconography, shape, and position in addition to color.

## Accessibility & Inclusion

Target WCAG AA contrast. Critical actions and severity states must not rely on color alone. The UI should support reduced motion, keyboard-accessible controls on desktop, large enough mobile touch targets, visible focus states, and readable timestamps/IDs. Alert language should be direct without panic, because operators need fast judgment rather than emotional amplification.
