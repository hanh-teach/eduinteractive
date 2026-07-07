# EduInteractive - Teacher Experience Engine

The Teacher Experience Engine is the runtime environment for educators. It enables the planning, creation, monitoring, and real-time intervention within the EduInteractive system.

---

## 1. Teacher Engine Lifecycle

Teachers do not just "create content"; they orchestrate learning journeys.

1.  **Plan:** Define objectives, competency goals, and path strategy.
2.  **Generate/Edit:** AI-assisted content construction (via `AICollaborationEngine`).
3.  **Publish:** Deploy to the student `LearningRuntimeEngine`.
4.  **Monitor:** Access `LearningAnalytics` in real-time.
5.  **Intervene:** Proactively scaffold learning for struggling students.
6.  **Assess/Reflect:** Evaluate artifacts and adjust curriculum for future cycles.

---

## 2. Event Subscription Model

*   **Subscribes to:** `LearningSessionStarted`, `StruggleIntensityDetected`, `EvidenceCreated`, `LessonCompleted`.
*   **Emits:** `CurriculumUpdated`, `TeacherInterventionTriggered`, `RubricUpdated`.

---

## 3. Teacher Dashboard & Analytics

The teacher dashboard is not a report; it is a **Command Center** for educational interventions.

| Analytics View | Responsibility |
| :--- | :--- |
| **Engagement Monitor** | View real-time attention metrics and confusion trends. |
| **Competency Tracker** | View mastery trajectory of class/individual. |
| **Intervention Cue** | AI-flagged students needing immediate human support. |
| **Artifact Review** | Evaluate high-stakes evidence (e.g., reflections/projects). |

---

## 4. Software Translation Layer

| Domain Entity | Infrastructure Component | Responsibility |
| :--- | :--- | :--- |
| `TeacherStudio` | `TeacherOrchestrationService` | Orchestrates the planning/publishing workflow. |
| `ContentEditor` | `ContentAuthoringService` | Manages object definitions and publishing. |
| `Intervention` | `TeacherInterventionService` | Processes teacher-led runtime overrides. |
