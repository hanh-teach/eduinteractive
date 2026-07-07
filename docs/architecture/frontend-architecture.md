# EduInteractive - Frontend Architecture (Phase 6)

This document defines the technical structure of the EduInteractive client-side applications (Student OS and Teacher Studio), focusing on real-time event synchronization and state management.

---

## 1. Tech Stack Selection

*   **Framework:** React 18+ with Vite for high-performance web delivery.
*   **State Management:** 
    *   **Zustand:** For local UI state (modals, tabs, local preferences).
    *   **React Query:** For fetching Projections (Competency State, Evidence Artifacts).
*   **Real-Time Layer:** **WebSockets (Socket.io)** or **Server-Sent Events (SSE)** connected to the `DomainEventDispatcher` via the `API Gateway`.
*   **Styling:** Tailwind CSS for a responsive, modular design system.
*   **Animations:** `motion/react` for event-driven UI transitions.

---

## 2. Real-Time State Synchronization

The frontend does not maintain "primary" state; it acts as a **Reactive Projection** of the backend Event Store.

*   **Event Listener:** The frontend subscribes to the `sessionId` topic partition via the Gateway.
*   **Action Flow:**
    1.  User performs action -> `POST /api/v1/events/ingest`.
    2.  Backend processes and emits `SYS`, `DERIVED`, or `ADVISORY` events.
    3.  Frontend receives event via WebSocket.
    4.  Frontend updates `LearningTimeline` and `MasteryPulse` instantly.

---

## 3. Modular Component Strategy

*   **Event-Aware Components:** UI components that listen for specific `eventTypes` to trigger internal animations or state changes (e.g., `EvidenceToast.tsx`).
*   **Execution Wrappers:** Generic containers that host `LearningObjects` (Video Players, Code Editors) and bridge their internal events (e.g., "Video Paused") to the `Event Backbone`.

---

## 4. Offline & Resilience Strategy

*   **Optimistic Updates:** UI reflects actions immediately while the `SYS` event is pending ingestion.
*   **Event Buffering:** If the connection is lost, events are queued in `localStorage` and flushed upon reconnection, ensuring no learning data is lost.
*   **Snapshotting:** The UI periodically fetches a full state snapshot from the Projection APIs to reconcile any missed events during network instability.
