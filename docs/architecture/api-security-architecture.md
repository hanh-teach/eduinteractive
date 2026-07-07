# EduInteractive - API & Security Architecture (Stream 2)

This document defines the secure API gateway architecture, authentication/authorization model, and security boundaries required for the EduInteractive Learning Runtime Operating System.

---

## 1. API Gateway Design

The API Gateway acts as the sole entry point, enforcing cross-cutting concerns before requests reach the internal service mesh.

*   **Role:**
    *   **Traffic Routing:** Routes requests to the correct Domain Service (Learning, Evidence, etc.).
    *   **Request Validation:** Enforces API Contracts (Schema validation).
    *   **Security Enforcement:** Authenticates users and enforces scopes.
    *   **Rate Limiting:** Protects system stability at a per-session/per-user level.
    *   **Event Forwarding:** Intercepts `POST /events` and forwards to the `Event Backbone` after validation.

---

## 2. Authentication & Authorization (AuthN/AuthZ)

We utilize a centralized Auth Service providing JWTs with specific claims.

*   **Identity Types:**
    *   `Student`: Learner, restricted access to session/evidence/competency.
    *   `Teacher`: Instructor, access to monitoring, intervention, and planning.
    *   `AI-Service`: Machine actor, restricted read-only scope for AI tasks.
*   **Claims-Based Access Control (CBAC):**
    *   JWT includes: `sub` (user ID), `role`, `scopes` (e.g., `session:read`, `event:ingest`, `competency:query`).
    *   **Scope Isolation:** AI actors do **not** receive `competency:write` or `session:mutate` scopes.

---

## 3. Security Boundaries & AI Access Control

The API Gateway enforces strict barriers to ensure system safety.

*   **AI Boundary:**
    *   The Gateway denies any request from the AI service that attempts to interact with `Command` APIs (e.g., `POST /events` which mutate state).
    *   AI is strictly limited to `GET` endpoints in the `Evidence` and `Competency` APIs via specific `AI_READ_ONLY` scopes.
*   **Event API Enforcement Layer:**
    *   Requests to `POST /api/v1/events/ingest` undergo **schema validation** against the `Schema Registry` at the Gateway.
    *   Invalid events are rejected immediately, never entering the `Event Backbone`.

---

## 4. Rate Limiting Strategy

To prevent system overload and ensure session-level performance:

*   **Per-Session Limits:** The Gateway applies strict throttling to `Event API` requests based on `sessionId`. If a student session generates events above the defined pedagogical threshold, the Gateway slows ingestion to protect the `RuntimeService`.
*   **Global Limits:** Applied to non-session queries to prevent scraping or denial-of-service against the dashboard projections.

---

## 5. Security Summary Table

| Requirement | Enforcement Mechanism | Responsibility |
| :--- | :--- | :--- |
| **Identity Verification** | JWT Validation | API Gateway |
| **Scope Enforcement** | Claims-based Access Control | API Gateway / Service Mesh |
| **Event Schema Compliance**| Schema Registry Validation | API Gateway |
| **AI Read-Only Enforce.** | Scopes & ACLs | API Gateway / Service Mesh |
| **Traffic Control** | Per-Session Rate Limiting | API Gateway |
