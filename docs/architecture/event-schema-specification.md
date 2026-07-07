# EduInteractive - Event Schema Specification

This document defines the canonical event format and governance rules for the EduInteractive Event Store. These specifications are mandatory for all system actors to ensure replay-safety, deterministic state reconstruction, and long-term event-sourced viability.

---

## 1. Canonical Event Format

All events within the `Event Backbone` must adhere to this unified JSON schema.

```json
{
  "eventId": "UUID",
  "eventType": "string", // Format: 'DOMAIN.ACTION' (e.g., 'SESSION.STARTED', 'ACTIVITY.COMPLETED')
  "version": "string",   // SemVer (e.g., '1.0.0')
  "sessionId": "UUID",   // Mandatory for Session Isolation
  "timestamp": "ISO8601",
  "actorId": "UUID",     // Who/What generated this (System, AI, Student, Teacher)
  "payload": "object",   // Domain-specific event data
  "metadata": {
    "traceId": "UUID",   // For cross-service correlation
    "source": "string"   // Component/Aggregate responsible
  }
}
```

---

## 2. Event Taxonomy Binding

All `eventType` values must be strictly categorized, governing their processing logic in the `DomainEventDispatcher`.

| Class | Prefix Pattern | Processing Rule |
| :--- | :--- | :--- |
| **System** | `SYS.*` | Mandatory state change. Replay-safe. |
| **Derived** | `DERIVED.*` | Computed asynchronously. Non-blocking. |
| **Advisory** | `ADVISORY.*` | AI-generated. Discardable/Non-authoritative. |

---

## 3. Event Immutability & Versioning Contract

*   **Immutability:** Events are strictly append-only. Once persisted to the Event Store, an event record **cannot** be modified or deleted. Correction of errors requires the emission of a compensating `CorrectionEvent`.
*   **Versioning:**
    *   Breaking changes to a payload (removing/renaming fields) **must** increment the major version (e.g., `1.x.x` -> `2.0.0`).
    *   Schema-compatible changes (adding optional fields) may increment the minor version.
    *   Consumers are responsible for mapping older event versions to the current domain model (Upcasting).

---

## 4. Event Governance Rules

1.  **Atomicity:** An event emission must be atomic. It represents a single, complete state transition within an aggregate.
2.  **Completeness:** The `payload` must contain all data required to reconstruct the state of the aggregate at the time of the event.
3.  **No Logic in Events:** Events must describe "what happened," not "what to do."
4.  **Session Determinism:** All `SYS.*` events must be associated with a valid `sessionId` to maintain runtime isolation.
