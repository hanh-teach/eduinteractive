# EduInteractive - AI Collaboration Engine

The AI Collaboration Engine defines how AI entities operate within the Learning Runtime as proactive, event-driven service actors rather than passive feature components.

---

## 1. AI Role Taxonomy

AI operates as a collaborative actor, categorized by instructional purpose:

| Role | Responsibility |
| :--- | :--- |
| **Observer** | Monitors event streams to detect patterns (confusion, engagement, struggle). |
| **Coach** | Provides guidance, scaffolds steps, and encourages reflection. |
| **Explainer** | Deconstructs complex topics and provides contextualized analogies. |
| **Predictor** | Forecasts potential dropout or mastery attainment based on behavior history. |
| **Adapter** | Adjusts content difficulty and suggests optimal learning paths. |
| **Summarizer** | Aggregates behavioral data into teacher-actionable insights. |

---

## 2. Event Subscription Model

The AI Engine does not "poll" for data; it subscribes to the `Event Backbone` (Layer 0).

| Subscribed Events | AI Role | Purpose |
| :--- | :--- | :--- |
| `AnswerSubmitted`, `HintRequested` | Coach, Observer | Monitor struggle intensity, trigger scaffolding. |
| `VideoProgress`, `CheckpointTriggered` | Observer, Predictor | Track engagement/confusion. |
| `LessonCompleted` | Summarizer, Predictor | Update mastery trajectory. |
| `ReflectionSubmitted` | Coach | Provide metacognitive feedback. |

---

## 3. AI Output Schema

All AI responses must be structured to ensure consistency in the runtime.

```json
{
  "actor": "AI_COLLABORATION_ENGINE",
  "requestId": "UUID",
  "type": "[HINT, EXPLANATION, RECOMMENDATION, PREDICTION, FEEDBACK]",
  "payload": {
    "content": "string",
    "contextualData": "object",
    "confidenceScore": "number"
  },
  "humanApprovalRequired": "boolean"
}
```

---

## 4. Human-in-the-loop (HITL) Rules

To maintain pedagogical integrity, the AI Collaboration Engine adheres to these governance constraints:

1.  **Non-Authoritative:** AI cannot finalize grades or override explicit teacher configurations (e.g., locked activities).
2.  **Teacher Override:** If a teacher manually modifies a learning path, AI recommendations are temporarily suppressed or re-aligned to the teacher's path.
3.  **Explainability:** Every recommendation must be accompanied by the pedagogical rationale (e.g., "Recommend X because student struggled with Y").
4.  **Reviewable Outputs:** High-stakes AI content generation (e.g., alternative curriculum paths) must be routed to the `TeacherStudio` for approval before rendering to the student.

---

## 5. Adaptive Control Flow

The logic follows an asynchronous, event-driven cycle:

1.  **Trigger:** Event Backbone emits behavior event (e.g., `AnswerRetried`).
2.  **Processing:** `AICollaborationEngine` correlates event with `StudentSessionState`.
3.  **Decision:** Engine evaluates rules against `CompetencyState` and `ScaffoldingPolicy`.
4.  **Action:** Engine emits `AIOutputGenerated` event with the `AIOutputSchema`.
5.  **Runtime Integration:** The UI/Interaction engine renders the suggestion only if `humanApprovalRequired` is false, or queues for teacher review.

---

## 6. Software Translation Layer

| Domain Entity | Infrastructure Component | Responsibility |
| :--- | :--- | :--- |
| **AI Collaboration** | `AICollaborationService` | Core logic for event-based AI decisioning. |
| **Observer/Predictor** | `LearningAnalyticsService` | Long-term behavior pattern analysis. |
| **Coach/Explainer** | `InferenceEngineService` | Real-time content & interaction generation. |
