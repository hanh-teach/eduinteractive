# EduInteractive - Learning Behavior Model

This document defines how the EduInteractive platform observes learner actions as data, transforming raw events into actionable pedagogical signals for our AI and Analytics engines.

---

## 1. Behavior Taxonomy & Signals

| Behavior Level | Examples | Learning Signal |
| :--- | :--- | :--- |
| **Content** | `WatchVideo`, `Pause`, `Replay` | Engagement, Attention, Confusion |
| **Interaction** | `Answer`, `Submit`, `Retry`, `Skip`, `Hint` | Comprehension, Mastery, Difficulty |
| **Cognitive** | `Reflect`, `Compare`, `Infer` | Deep Learning, Critical Thinking |
| **Exploration** | `OpenResource`, `BranchSelect` | Autonomy, Curiosity |
| **Creation** | `WriteAnswer`, `RecordAudio` | Expression, Application |
| **Social** | `Discuss`, `PeerReview` | Communication, Collaboration |

---

## 2. Behavior Event Map

Mapping specific user behaviors to raw events and their derived pedagogical signals.

| Behavior | Raw Event | Learning Signal |
| :--- | :--- | :--- |
| **AnswerQuestion** | `AnswerSubmitted` | Accuracy, Response Time |
| **WatchVideo** | `VideoProgress` | Engagement Duration, Dropout Rate |
| **RetryAnswer** | `AnswerRetried` | Conceptual Difficulty |
| **RequestHint** | `HintRequested` | Struggle Intensity |
| **Reflect** | `ReflectionSubmitted` | Meta-cognition Score |

---

## 3. Learning Analytics Pipeline

The behavior data flows through the system to update the state of the `CompetencyEngine` and inform the `RecommendationEngine`.

**Pipeline Stage:**
`User Behavior` -> `Raw Event` -> `Behavior Engine` -> `Derived Signal` -> `Insight` -> `Competency Update` -> `Recommendation`

---

## 4. Difficulty & Adaptive Trigger Models

### Difficulty Detection
Detected when a pattern of `AnswerRetried` (High) + `AccuracyScore` (Low) is observed.
*   **Result:** Triggers `DifficultyThresholdExceeded` event.

### Adaptive Triggers
| Detected State | Triggers | System Action |
| :--- | :--- | :--- |
| **Struggle** | `HintRequested` / `DifficultyThresholdExceeded` | Trigger `HintEngine`, Scaffold content. |
| **Mastery** | `AccuracyThresholdMet` (High) | Trigger `MasteryEvent`, advance to next lesson. |
| **Confusion** | `VideoReplay` (High) + `SeekBackward` | Trigger `ReExplanationEngine`. |

---

## 5. Cognitive Signal Model

Signals used by the AI engine to evaluate learner status:
*   **Attention:** Derived from `VideoProgress` and `IdleTime`.
*   **Comprehension:** Derived from `AnswerSubmitted` and `Accuracy`.
*   **Retention:** Derived from `TimeSinceLastActivity` and `PerformanceOnRecall`.
*   **Transfer Ability:** Derived from `PerformanceOnNewActivityType` (Simulation vs Quiz).
*   **Problem-Solving:** Derived from `ProcessSteps` and `ComplexityLevel`.
