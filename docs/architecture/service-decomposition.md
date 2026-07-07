# EduInteractive - Service Decomposition Blueprint (Phase 4)

This blueprint decomposes the EduInteractive Learning Runtime Operating System into independent, deployable services based on the established DDD Aggregates and Bounded Contexts.

---

## 1. Service Map & Responsibilities

| Service | Bounded Context | Domain Aggregates Owned | Key Responsibility |
| :--- | :--- | :--- | :--- |
| **Ingestion Gateway** | Event Backbone | - | Validates/Routes API commands to Backbone. |
| **Runtime Service** | Learning Session | `LearningExecutionAggregate` | Orchestrates active learning sessions. |
| **Evidence Service** | Evidence Domain | `EvidenceAggregate` | Validates/Stores immutable learning proofs. |
| **Competency Service** | Competency Domain | `CompetencyAggregator` | Computes dynamic mastery states. |
| **AIService** | AI Collaboration | - | Proactive AI advice/scaffolding engine. |
| **Teacher Studio** | Teacher Experience | - | Planning, Monitoring, Interventions. |
| **Catalog Service** | Reference Content | `LearningObjectAggregate` | Manages Lesson/Activity definitions. |

---

## 2. Service-Aggregate Isolation Rules

To maintain the architectural integrity established in previous phases:

1.  **Strict Data Isolation:** Each service owns its database schema. No service is allowed to query another service's database directly (e.g., `CompetencyService` cannot query `EvidenceService` DB).
2.  **Event-Driven Communication:** Cross-service data access occurs via:
    *   **Async Events:** Consuming events from the `EventBackbone`.
    *   **Synchronous Read-Only API:** Calling Read-Model APIs of other services for necessary context.
3.  **Aggregated Authority:** Only the owning service can modify the state of an Aggregate. (e.g., Only `CompetencyService` can emit `CompetencyUpdated`).

---

## 3. Event Ownership & Dispatching

*   **Ingestion Gateway:** Emits `SYS.*` (System) events based on API commands.
*   **Runtime Service:** Owns lifecycle events (`SESSION.STARTED`, `ACTIVITY.COMPLETED`).
*   **Evidence Service:** Owns `EvidenceCreated` (Derived) events.
*   **Competency Service:** Owns `CompetencyUpdated` (Derived) events.
*   **AIService:** Emits `ADVISORY.*` events.

---

## 4. Deployment Architecture Principles

*   **Scalability:** Each service is independently deployable and scalable based on workload (e.g., `RuntimeService` needs low latency during peak hours, `CompetencyService` needs high CPU during batch recalculations).
*   **Observability:** All services must emit standard trace IDs to the `Event Backbone` for cross-service request tracing.
*   **Failure Isolation:** A failure in the `AIService` must **not** halt the `RuntimeService` from proceeding with basic lesson execution.
