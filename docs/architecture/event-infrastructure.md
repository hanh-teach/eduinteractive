# EduInteractive - Event Infrastructure (Stream 1)

This document defines the high-performance event backbone required to power the EduInteractive Learning Runtime OS. It utilizes a distributed streaming architecture to ensure session isolation, ordering, and replayability.

---

## 1. Event Bus Topology (Kafka)

The system utilizes a distributed event bus (Kafka-compatible) as the central nervous system.

*   **Ingestion Path:** `API Gateway` -> `Event Ingestion Service` -> `Event Backbone`.
*   **Processing Path:** `Backbone` -> `Domain Services` (Learning, Evidence, Competency) -> `Backbone` (Derived/Advisory events).
*   **Persistence:** The `EventStore` acts as the long-term cold storage, while the `Event Bus` manages real-time state propagation and hot-replay.

---

## 2. Topic Strategy & Partitioning

To maintain session determinism, the system employs a two-dimensional topic model.

### A. Topic Classification
| Topic Class | Prefix | Authority |
| :--- | :--- | :--- |
| **System** | `sys.*` | Authoritative state changes (e.g., `sys.session.started`). |
| **Derived** | `derived.*` | Computed states (e.g., `derived.competency.updated`). |
| **Advisory** | `advisory.*` | AI-generated signals (e.g., `advisory.ai.hint_offered`). |

### B. Partitioning Strategy
*   **Partition Key:** `sessionId`.
*   **Guarantee:** All events for a specific learning session are guaranteed to be delivered in-order to the same consumer group instance, preventing race conditions in the `LearningRuntimeEngine`.

---

## 3. Schema Registry & Governance

*   **Registry Enforcement:** No event is accepted into the backbone unless it validates against the `Schema Registry`.
*   **Version Binding:** Consumers bind to specific major versions of event schemas to prevent breaking changes from disrupting the runtime.

---

## 4. Replay & Recovery Mechanisms

*   **Session Hot-Replay:** Services can request a replay of the last $N$ events for a `sessionId` directly from the bus for fast state recovery.
*   **Full State Rebuild:** The `CompetencyEngine` can trigger a full replay from the `EventStore` (Layer 5) to reconstruct the mastery trajectory of a student from ground truth.
