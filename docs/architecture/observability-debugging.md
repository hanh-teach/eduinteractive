# EduInteractive - Observability & Debugging (Stream 4)

This document defines the observability framework required to monitor, debug, and audit the EduInteractive OS. It focuses on distributed tracing, AI explainability, and competency state validation.

---

## 1. Distributed Tracing (Learning Session Lifecycle)

We utilize **OpenTelemetry** to trace every learning interaction across service boundaries.

*   **Trace Context:** Every `SYS` event carries a `traceId` initiated at the API Gateway.
*   **Span Granularity:** Spans cover event ingestion, behavior interpretation, evidence validation, and competency calculation.
*   **Visibility:** Enables the "Single Learning Session" view, showing exactly how a student's action flowed through the OS to update their competency state.

---

## 2. AI Decision Logging & Explainability

AI Advisory events must be fully auditable to maintain pedagogical integrity.

*   **Advisory Context:** Every `ADVISORY` event is logged with the `competencySnapshot` and `behaviorHistory` used by the AI to formulate the suggestion.
*   **Audit Trail:** Teachers can view the "Why?" behind an AI-suggested hint or path change by expanding the decision log in the Teacher Dashboard.

---

## 3. Competency Reconstruction Debugger

A specialized utility to verify the integrity of the `Competency Engine`.

*   **Drift Detection:** Periodically compares the active `CompetencyState` projection with a clean-room reconstruction from the `EventStore`.
*   **Time-Travel Debugging:** Allows developers/architects to "play back" a student's history to see exactly which `EvidenceBundle` triggered a mastery stage transition.

---

## 4. Learning Timeline (The "TiVo" of Learning)

A visual representation of the `EventStore` for a specific session.

*   **Playback UI:** A diagnostic tool for teachers to watch a "replay" of the student's learning session, showing real-time event emissions and AI interventions.
*   **State Inspection:** Click on any event in the timeline to see the system state (Session, Objects, Competencies) at that specific millisecond.
