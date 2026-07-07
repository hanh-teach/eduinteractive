# EduInteractive - MVP Implementation Plan (Phase 6)

This document defines the scope, milestones, and rollout strategy for the "Hero Lesson" — the first functional realization of the EduInteractive OS.

---

## 1. MVP Scope: The "Hero Lesson"

*   **Subject:** Tin học THCS - "If Statement in Python".
*   **Core Goal:** Demonstrate the end-to-end flow from student interaction to competency update and teacher intervention.

### A. Learning Flow
1.  **Introduction:** Video content explaining the "if" concept.
2.  **Interaction 1:** Mid-video quiz (Multiple choice).
3.  **Interaction 2:** Live coding challenge (Basic if statement).
4.  **Closing:** Summary and AI-suggested next path.

### B. Event Checklist (The "Proof of Architecture")
*   `SYS.SESSION.STARTED`
*   `SYS.LEARNING.VIDEO_PAUSED` (Behavior signal)
*   `SYS.LEARNING.QUIZ_SUBMITTED`
*   `DERIVED.EVIDENCE.CREATED` (Based on quiz/code results)
*   `DERIVED.COMPETENCY.UPDATED` (Logic & Syntax skills)
*   `ADVISORY.AI.HINT_OFFERED` (If code fails twice)

---

## 2. Implementation Milestones

| Milestone | Deliverable | Authority |
| :--- | :--- | :--- |
| **M1: Core Runtime**| `LearningExecutionAggregate` + Event Ingestion | System Core |
| **M2: Intelligence**| `EvidenceEngine` + `CompetencyEngine` (Python Logic) | Domain Engines |
| **M3: Interface** | Student OS (Basic) + Teacher Studio (Live Trace) | Frontend Team |
| **M4: Integration** | End-to-End "If Statement" Lesson Execution | QA / Architect |

---

## 3. Deployment & Rollout

*   **Internal Alpha:** Running the "Hero Lesson" in a controlled environment to verify Event-Source integrity.
*   **Beta Sandbox:** Testing with a small group of students to monitor AI Advisory performance and Teacher intervention latency.
*   **Production V1:** Launching as a supplemental module in a local school curriculum.

---

## 4. Definition of Success
1.  **Deterministic Replay:** Can we reconstruct the entire student session from the `EventStore`?
2.  **AI Integrity:** Did AI stay within its `ADVISORY` boundaries?
3.  **Teacher Insight:** Did the teacher receive accurate, real-time mastery updates?
