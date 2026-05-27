# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

This repo is multi-context. Start from `CONTEXT-MAP.md` at the repo root, then read the context docs relevant to the work.

Current map:

- `CONTEXT-MAP.md` describes the delivery surfaces and points to the shared Aegis Traffic domain language.
- `CONTEXT.md` defines the shared product language for suspected incidents, incident review, evidence sets, review priority, and response tasks.
- `docs/adr/` contains system-wide architectural decisions.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root. It points at context docs and describes how delivery surfaces relate.
- **Relevant `CONTEXT.md` files** named by the context map. Read each one relevant to the topic.
- **`docs/adr/`** for decisions that touch the area you're about to work in.
- **Context-scoped ADRs**, if present, such as `src/<context>/docs/adr/` or a delivery-surface equivalent.

If any of these files don't exist, proceed silently. Don't flag their absence; don't suggest creating them upfront. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## Use the glossary's vocabulary

When your output names a domain concept, such as in an issue title, refactor proposal, hypothesis, or test name, use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use, or there's a real gap to note for `/grill-with-docs`.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0001 (separate incident review from response task), but worth reopening because..._
