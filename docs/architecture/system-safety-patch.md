# EduInteractive - System Safety & Runtime Safety Patch

This document serves as the mandatory architectural patch to secure the EduInteractive runtime, addressing the critical gaps identified in the System-Level Review.

---

## 1. Patch 1: Learning Session Context Layer

To ensure determinism and prevent data contamination, all system entities must be bound to a strict `LearningSessionContext`.

*   **Global Context Isolation:** Every event emitted by the Backbone (Layer 0) **must** contain `sessionId` in its metadata.
*   **Scoped Consumers:** All downstream engines (Behavior, Evidence, Competency) must partition their processing pipelines by `sessionId`.
*   **Runtime Partitioning:** The `LearningRuntimeEngine` manages the lifecycle of this session. No system entity is allowed to ingest events without a valid, active `sessionId`.
*   **Impact:** Prevents cross-contamination of learning data and ensures that analytics/competency updates remain session-bound and deterministic.

---

## 2. Patch 2: AI Strict Access Policy

To maintain pedagogical integrity, AI is restricted to a **Read-Only Advisory Role** within the runtime.

*   **Read-Only Boundary:** The AI Collaboration Engine is **forbidden** from writing to the system state.
*   **AI Access Path:** 
    1.  `Filtered Event Stream` (Anonymized/Contextualized)
    2.  `Validated Evidence Repository` (Read-Only)
    3.  `Competency State` (Read-Only)
*   **Prohibited Action:** AI cannot infer mastery directly from raw `Behavior`. It must wait for the `EvidenceEngine` to generate validated evidence before formulating suggestions.
*   **Pedagogical Enforcement:** AI output is treated strictly as an `AdvisoryEvent` (`RecommendationGenerated`), requiring runtime orchestration before presentation.

---

## 3. Patch 3: Competency Write Protocol

To prevent state corruption and race conditions, the system enforces a **Single Writer / Event-Sourced Authority** for competency updates.

*   **Single Writer Rule:** The `CompetencyEngine` is the **only** entity authorized to emit a `CompetencyUpdated` event. 
*   **Event-Sourcing Requirement:** Competency updates can **only** be triggered by an `EvidenceCreated` event. No other service, actor, or AI agent can update a competency record directly.
*   **Immutability:** Once a `CompetencyUpdated` event is emitted, the state is immutable until the next event iteration, ensuring the auditability of the mastery trajectory.
*   **Enforcement:** The `Event Backbone` enforces a policy that filters unauthorized emitters for `CompetencyUpdated` topics.

---

## 4. Runtime Integrity Summary

| Constraint | Enforcement Mechanism | Responsibility |
| :--- | :--- | :--- |
| **Session Isolation** | Backbone Topic Partitioning | `LearningRuntimeEngine` |
| **AI Read-Only** | API/Service Access Control List (ACL) | `InfrastructureLayer` |
| **Competency Write** | Event Backbone Emitter Filtering | `EventBackbone` |
