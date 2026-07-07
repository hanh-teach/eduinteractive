# EduInteractive - Competency Engine

The Competency Engine is the long-term memory of a learner’s capability. It dynamically computes mastery levels across a multi-dimensional state space based on accumulated `Evidence` (from Layer 5).

---

## 1. Multi-Dimensional Competency Model

Competency is represented as a dynamic vector rather than a static score.

```json
{
  "competencyId": "UUID",
  "name": "string",
  "dimensions": {
    "accuracy": "float",     // 0.0 - 1.0
    "consistency": "float",  // Stability over time
    "transfer": "float",     // Ability to apply in new context
    "independence": "float", // Ability to perform without scaffolding/hints
    "speed": "float"         // Efficiency
  },
  "masteryStage": "[Emerging, Developing, Proficient, Mastery]",
  "confidenceScore": "float",
  "lastUpdated": "ISO8601"
}
```

---

## 2. Mastery Calculation Algorithm

The engine updates the competency vector using an event-driven recalculation:

`CompetencyVector = f(EvidenceSet, EvidenceWeight, TimeDecayFactor)`

1.  **Evidence Aggregation:** All evidence linked to this competency is retrieved.
2.  **Time Decay:** Older evidence is penalized to ensure the competency reflects current capability.
3.  **Weighting:** 
    *   Teacher Evaluation (High weight)
    *   AI-validated Evidence (Medium weight)
    *   Behavioral Indicators (Continuous, low-individual-impact weight)
4.  **Dimension Calculation:** Aggregated data is mapped to the dimensions (Accuracy, Consistency, etc.) based on the activity context.

---

## 3. Competency Graph

Competencies exist in a dependency graph, where mastery in a prerequisite competency enhances the calculation of higher-level competencies.

*   **Structure:** A Directed Acyclic Graph (DAG) where nodes are `CompetencyEntities`.
*   **Propagation:** Updating a child competency (e.g., "Linear Equations") can trigger an re-evaluation of parent competencies (e.g., "Algebra").

---

## 4. Integration & Event Loop

*   **Input:** Subscribes to `EvidenceCreated` events (Layer 0).
*   **Logic:** `CompetencyEngine` runs the dynamic calculation algorithm.
*   **Output:** Emits `CompetencyUpdated` event (Layer 0) if the `masteryStage` transitions or `confidenceScore` changes significantly.

---

## 5. Software Translation Layer

| Domain Entity | Infrastructure Component | Responsibility |
| :--- | :--- | :--- |
| `Competency` | `CompetencyCatalogService` | Manages definitions, taxonomy, and rubric mappings. |
| `MasteryCalculation` | `CompetencyCalculationEngine` | Executes the dynamic multi-dimensional formula. |
| `CompetencyState` | `CompetencyStateService` | Stores the current state vector for each student/competency pair. |
| `DependencyGraph` | `CompetencyGraphService` | Manages prerequisite relationships and propagates updates. |
