# EduInteractive - UI/UX System Design (Phase 6)

This document defines the user experience and interaction models for the EduInteractive Operating System. It translates the underlying event-sourced architecture into a reactive, human-centric learning interface.

---

## 1. Student OS: The Reactive Learning Environment

The Student OS is a "Living Learning Experience" that reacts in real-time to learner behavior.

### A. Core Interface Layout
*   **Primary Canvas:** The main learning object execution area (Video, Code Editor, Interactive Simulation).
*   **The Learning Timeline (Event Stream):** A sidebar or bottom rail that visualizes the `Event Backbone` as a chronological "story" of the student's journey.
    *   *Nodes:* Start, Checkpoint, Evidence Generated, Hint Received.
*   **Mastery Pulse:** A dynamic, non-intrusive indicator of current competency levels (Accuracy, Consistency, etc.).

### B. Interaction Feedback Loop
*   **Evidence Popups:** Subtle notifications triggered by `EvidenceCreated` events. 
    *   *Copy:* "Proof of Logic captured!" or "Consistency milestone reached."
*   **Hint Injection (AI Scaffolding):** A context-sensitive overlay triggered by `ADVISORY.AI.HINT_OFFERED`.
    *   *Behavior:* Non-interruptive; fades in beside the active task.
*   **State Transitions:** Smooth animations between learning objects orchestrated by the `LearningExecutionAggregate`.

---

## 2. Teacher Studio: The Orchestration Cockpit

The Teacher Studio is designed for high-level monitoring and real-time pedagogical intervention.

### A. Dashboard Modules
*   **Live Session Trace:** A real-time replay of the `EventStore`. Teachers can see exactly where every student is in their timeline.
*   **Competency Heatmap:** A class-wide visualization of `CompetencyState` projections.
    *   *Filter:* View by Dimension (e.g., "Who is struggling with Independence?").
*   **AI Advisory Panel:** A list of active `ADVISORY` events across the class.
    *   *Actions:* Approve, Reject, or Modify the AI's suggested intervention.

### B. Intervention Controls
*   **The Kill Switch:** Pause a student's session immediately to provide 1-on-1 support.
*   **Instruction Injection:** Send a manual instruction or resource directly to a student's `LearningTimeline`.

---

## 3. UI-Event Binding Rules

| Event Class | UI Reaction (Student) | UI Reaction (Teacher) |
| :--- | :--- | :--- |
| **SYS.SESSION_STARTED** | Initialized Timeline | Session entry in Live Trace |
| **SYS.ACTIVITY_COMPLETED**| Timeline Node Completion | Progress update on Heatmap |
| **DERIVED.EVIDENCE_CREATED**| Evidence Toast Notification | Artifact badge in Trace view |
| **DERIVED.COMPETENCY_UPD.**| Mastery Pulse animation | Heatmap color transition |
| **ADVISORY.AI.HINT** | Hint Drawer opens | Intervention alert in Panel |

---

## 4. Design Aesthetics
*   **Theme:** "Cosmic Slate" — High-contrast dark theme for focus, with vibrant accent colors for different event classes (System: Blue, Evidence: Green, AI: Purple).
*   **Typography:** Inter (Sans-serif) for UI; JetBrains Mono for data and event logs.
