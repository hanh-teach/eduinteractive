# EduInteractive - API Contract Layer (Phase 3)

This document defines the RESTful API contracts for the EduInteractive Learning Runtime Operating System. These contracts are directly mapped to the DDD aggregates and services defined in Phase 2, adhering to Command-Query Responsibility Segregation (CQRS) principles.

---

## 1. Core API Groups

| API Group | Responsibility | Mapping (Phase 2) |
| :--- | :--- | :--- |
| **Session API** | Orchestrates runtime execution. | `LearningExecutionAggregate` |
| **Event API** | Command ingestion for Event Backbone. | `EventBackbone` |
| **Evidence API** | Query/Submission of proofs. | `EvidenceRepository` |
| **Competency API**| State query of learner mastery. | `CompetencyEngine` |
| **AI Interaction** | Recommendation and Scaffolding. | `AICollaborationEngine` |

---

## 2. Session API (Orchestration)

*Base path: `/api/v1/sessions`*

*   `POST /`: Initialize new learning session.
    *   *Input:* `studentId`, `lessonId`
    *   *Output:* `sessionId`, `initialState`
*   `POST /{sessionId}/execute`: Transition execution state (READY -> EXECUTING).
    *   *Input:* `action` (e.g., START, PAUSE, RESUME)
*   `GET /{sessionId}/status`: Get current session state and active object.

---

## 3. Event API (Ingestion - Command)

*Base path: `/api/v1/events`*

*   `POST /ingest`: Ingest authoritative/derived system events.
    *   *Input:* `{ sessionId, type, payload, timestamp }`
    *   *Note:* Strictly partitioned by `sessionId` (Patch 2.1).

---

## 4. Evidence API (Query/Submission)

*Base path: `/api/v1/evidence`*

*   `POST /`: Submit new proof (System-only Authority).
*   `GET /{studentId}?competencyId={cid}`: Retrieve learner evidence for a specific competency.

---

## 5. Competency API (Query)

*Base path: `/api/v1/competencies`*

*   `GET /state/{studentId}`: Get full competency state vector.
*   `GET /history/{studentId}/{competencyId}`: Retrieve mastery trajectory over time.

---

## 6. AI Interaction API (Advisory)

*Base path: `/api/v1/ai`*

*   `GET /recommendation/{sessionId}`: Request next adaptive step.
    *   *Constraint:* Returns `AdvisoryEvent` structure.
*   `POST /scaffold/{sessionId}`: Request immediate scaffolding/hint based on current behavior.

---

## 7. Architectural Integrity Invariants

1.  **Session Binding:** Every request, where applicable, must pass `sessionId` as part of the header or path context.
2.  **Event Sourcing Authority:** Client-side UI is forbidden from submitting state-changing commands directly to `CompetencyAPI`. State changes MUST flow through `Event API`.
3.  **Read-Only AI:** The `AI Interaction API` is strictly Read-Only concerning system state aggregates (`Competency`, `Session`).
