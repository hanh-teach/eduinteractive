# EduInteractive - Evidence Engine

The Evidence Engine is responsible for capturing, validating, and storing "Learning Evidence"—immutable, rich artifacts that prove learning has occurred. It transforms raw behavioral data and AI insights into structured proofs linked to student competencies.

---

## 1. Evidence Data Model

Each `Evidence` entity acts as a formal, structured proof.

```json
{
  "id": "UUID",
  "studentId": "UUID",
  "objectId": "UUID", // The LearningObject (Lesson/Activity) linked
  "behaviorId": "UUID", // The specific Behavior from Layer 3
  "eventChain": ["UUID"], // Traceable link to Layer 0 Events
  "timestamp": "ISO8601",
  "type": "[COGNITIVE, BEHAVIORAL, PERFORMANCE, REFLECTIVE, CREATIVE]",
  "payload": {
    "raw": "object", // Original data
    "interpreted": "object" // Semantic meaning
  },
  "confidenceScore": "number", // 0.0 - 1.0
  "mappedCompetencies": ["CompetencyID"],
  "isImmutable": true
}
```

---

## 2. Evidence Lifecycle Pipeline

1.  **Captured:** Triggered by `BehaviorEngine` or `AICollaborationEngine` events.
2.  **Enriched:** `AICollaborationEngine` adds semantic tagging and context.
3.  **Validated:** System checks against `Rubric` or `PedagogicalRule`.
4.  **Interpreted:** `EvidenceEngine` maps raw data to educational meaning.
5.  **Aggregated:** Evidence combined into `EvidenceBundles` for higher-level `Competency` assessment.
6.  **Stored:** Written to an immutable storage service.

---

## 3. Evidence Classification System

| Class | Definition | Source |
| :--- | :--- | :--- |
| **Cognitive** | Proof of concept understanding. | Quiz/Interaction results. |
| **Behavioral** | Proof of learning process/strategy. | Interaction log patterns. |
| **Performance** | Proof of application in context. | Simulation/Task completion. |
| **Reflective** | Proof of meta-cognition. | Reflection reports/prompts. |
| **Creative** | Proof of concept synthesis. | Project work/Artifacts. |

---

## 4. Traceability Chain (The Path of Proof)

The system enforces strict traceability to ensure every piece of evidence is explainable.

**Traceability Link:**
`Competency` ← `Evidence` ← `Behavior` ← `Event Chain` (Layer 0)

*   **Auditability:** Every `Evidence` record contains the `eventChain` array, allowing the system to reconstruct the exact `LearningSession` state that produced it.

---

## 5. Evidence → Competency Mapping Matrix

| Evidence Type | Primary Competency Link | Software Module |
| :--- | :--- | :--- |
| Cognitive | `Critical Thinking`, `Knowledge` | `AssessmentEngine` |
| Behavioral | `Self-Directed Learning` | `BehaviorEngine` |
| Performance | `Problem Solving` | `SimulationEngine` |
| Creative | `Innovation` | `PortfolioService` |

---

## 6. Software Translation Layer

| Domain Entity | Infrastructure Component | Responsibility |
| :--- | :--- | :--- |
| `Evidence` | `EvidencePersistenceService` | Stores immutable evidence artifacts. |
| `EvidenceEngine` | `EvidenceOrchestratorService` | Manages capture, enrichment, and validation flows. |
| `EvidenceBundle` | `EvidenceAggregationService` | Groups multiple evidence points for `Competency` updates. |
