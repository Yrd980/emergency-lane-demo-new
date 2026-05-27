# Split Domain Rules From SQL Query Adapters

Aegis Traffic separates backend read and rule logic into three layers: `domain` modules hold Incident Review, Evidence Set, Review Priority, Suspected Incident projection, and Response Task rules; `queries` modules hold SQLite-specific read adapters; and `services` keep transaction orchestration and application flow. This preserves the Incident Review and Response Task boundary from ADR-0001 while avoiding a broad repository abstraction before the schema and workflows need one.

**Consequences**

Query adapters are deliberately functional and SQLite-specific. They may expose row shapes selected for current API projections, but domain modules own lifecycle vocabulary, guard logic, and computed fields such as Review Priority and peak Evidence Set thumbnails.

Services may still contain write SQL where the write flow is small and transaction-oriented. Extract write adapters only when Incident Review or Response Task creation grows enough that the service stops reading as application flow.
