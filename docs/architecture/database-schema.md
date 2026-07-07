# EduInteractive - Database Schema Architecture (Phase 3)

This document defines the storage strategy for the EduInteractive OS, balancing the requirements of an Event-Sourced Runtime with high-performance query capabilities for the teacher and learner dashboards.

---

## 1. Event Store (The Ground Truth)

The `EventStore` is an append-only, immutable table serving as the source of truth.

| Column | Type | Constraints |
| :--- | :--- | :--- |
| `event_id` | UUID | Primary Key |
| `session_id` | UUID | Indexed (for partitioning) |
| `event_type` | VARCHAR | Indexed (e.g., 'SYS.SESSION_STARTED') |
| `version` | VARCHAR | SemVer |
| `timestamp` | TIMESTAMPTZ| Indexed (for ordering) |
| `actor_id` | UUID | - |
| `payload` | JSONB | Data (Schema validated by Event Schema) |
| `metadata` | JSONB | traceId, source |

*   **Partitioning Strategy:** Partitioned by `session_id` to ensure localized runtime performance.

---

## 2. Projection Tables (Materialized Views)

Projections are derived from the `EventStore` and serve read-heavy queries (API queries).

### A. Session Projection
`session_state` table: Tracks the active runtime state of a learning session.
*   `session_id` (PK)
*   `student_id` (FK)
*   `current_object_id` (Activity/Lesson)
*   `state` (READY, EXECUTING, etc.)
*   `context` (JSONB)

### B. Evidence Repository
`evidence_artifacts` table: Stores immutable proofs.
*   `evidence_id` (PK)
*   `session_id` (FK)
*   `student_id` (FK)
*   `competency_ids` (ARRAY)
*   `payload` (JSONB)
*   `confidence_score` (NUMERIC)

### C. Competency Engine Projection
`competency_states` table: Represents the current multi-dimensional mastery state.
*   `student_id` (PK)
*   `competency_id` (PK)
*   `mastery_vector` (JSONB)
*   `mastery_stage` (ENUM: Emerging, Developing, Proficient, Mastery)
*   `last_updated` (TIMESTAMPTZ)

---

## 3. Indexing & Scaling Strategy

*   **Global Indexes:**
    *   `idx_event_type_timestamp`: For analytics queries.
    *   `idx_student_competency`: For learner dashboard rendering.
*   **Partitioning:** 
    *   `EventStore` table is partitioned by `session_id` (hash partitioning) to maintain low latency during event ingestion.
*   **Replay Strategy:** System state (Competencies/Evidence) can be fully rebuilt by replaying events from `EventStore` for a given `student_id` or `session_id` if projections are corrupted.

---

## 4. Consistency Model
*   **EventStore:** Strong Consistency (Write Authority).
*   **Projections:** Eventual Consistency (updated via `DomainEventDispatcher` triggers).
