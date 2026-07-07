# EduInteractive - Domain Core Model Blueprint (Phase 2)

This blueprint defines the core DDD entities (Aggregates, Value Objects, Domain Services) that constitute the EduInteractive Learning Runtime. These entities are directly derived from our 6-layer architecture and enforce the established safety protocols (Session Isolation, Read-Only AI, Event-Sourced Authority).

---

## 1. Core Aggregates (Root Entities)

These are the primary consistency boundaries in our system.

| Aggregate Root | Responsibility | Event-Sourced Scope |
| :--- | :--- | :--- |
| `LearningSession` | Manages the active runtime state of a student. | `SessionId` |
| `LearningObject` | Represents the structural components (Lesson/Activity).| Global/Immutable |
| `EvidenceBundle` | Aggregates learner proofs within a session. | `SessionId` |
| `CompetencyAggregator` | Tracks mastery trajectory for a student/domain. | `StudentId` |

---

## 2. Entity & Value Object Definitions

### A. Value Objects (Immutable, identify by value)
*   `EventContext`: {sessionId, timestamp, actorId, context}
*   `CompetencyVector`: {accuracy, consistency, transfer, independence, speed}
*   `EvidencePayload`: {raw, interpreted, type}
*   `MasteryStage`: [Emerging, Developing, Proficient, Mastery]

### B. Entities (Mutable, identify by Identity)
*   `Student`: {id, profile, sessionHistory[]}
*   `Competency`: {id, taxonomy, rubrics, stateVector}

---

## 3. Domain Services (Orchestrators)

Domain services handle logic that does not naturally fit into an aggregate.

*   `RuntimeOrchestrator`: Coordinates the `LearningSession` state machine and event ingestion.
*   `EvidenceValidator`: Applies `Rubrics` to validate `Evidence` captured by the system.
*   `CompetencyCalculationEngine`: The single-writer service authorized to emit `CompetencyUpdated`.
*   `RecommendationEngine`: Advisory service that processes `CompetencyState` to suggest next steps.

---

## 4. Interaction Protocol (DDD Mapping)

| Domain Concept | Aggregate/Entity | Lifecycle Policy |
| :--- | :--- | :--- |
| **Activity Execution** | `LearningSession` | ephemeral (per session) |
| **Knowledge Proof** | `Evidence` | immutable (append-only) |
| **Ability State** | `CompetencyAggregator` | derived (event-sourced projection) |

---

## 5. Architectural Invariants (Enforced in Code)

1.  **Session Isolation:** No Domain Service can load an Aggregate without a validated `SessionId`.
2.  **Event Sourcing:** `CompetencyAggregator` state can **only** be rebuilt from the event log (Layer 0) or the `Evidence` repository.
3.  **Read-Only Boundary:** The `RecommendationEngine` and `AICollaborationEngine` must interact with `Aggregates` via Read-Only interfaces.
