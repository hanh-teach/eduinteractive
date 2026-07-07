# EduInteractive - Deployment & Scaling Architecture (Stream 3)

This document defines the production infrastructure, Kubernetes topology, scaling strategies, and fault-tolerance mechanisms for the EduInteractive Learning Runtime Operating System.

---

## 1. Infrastructure Topology (Kubernetes)

The system is deployed on Kubernetes to facilitate rapid scaling and service isolation.

*   **Ingress Layer:** Managed via a high-availability Ingress Controller (e.g., Nginx or Istio Gateway) routing to the API Gateway.
*   **Service Mesh:** Istio or Linkerd to manage cross-service communication (mTLS) and observability.
*   **Node Pools:**
    *   **Runtime Pool:** Optimized for low-latency, memory-intensive workloads (Runtime Service).
    *   **Compute Pool:** Optimized for CPU-intensive workloads (Competency Engine, AI Inference).
    *   **Backbone Pool:** Dedicated to high-throughput message streaming (Kafka).

---

## 2. Service Scaling Strategy

Services are categorized into profiles to determine autoscaling policies (HPA):

| Service Profile | Scaling Metric | Target |
| :--- | :--- | :--- |
| **I/O Bound (API, Runtime)** | Requests per Second (RPS) | Latency-optimized |
| **CPU Bound (Competency)** | CPU Utilization / Queue Depth | Throughput-optimized |
| **Memory Bound (AI)** | Memory / GPU (if applicable) | Resource-optimized |

*   **Learning Runtime Service:** Employs aggressive HPA to handle peak-hour concurrent session spikes.
*   **Competency Service:** Scales based on `EventStore` lag, ensuring mastery updates keep pace with real-time evidence generation.

---

## 3. Event Backbone (Kafka) Scaling

The backbone uses partition affinity to ensure determinism.

*   **Partitioning Key:** `sessionId` is used as the Kafka partition key.
*   **Guarantee:** All events belonging to a single learning session are processed in strict order by the same consumer group instance.
*   **Scaling:** As load increases, increase partition count to allow for more consumer group parallelism (up to one consumer per partition).

---

## 4. Fault Tolerance & Availability

*   **Multi-AZ Deployment:** All services and Kafka brokers are distributed across at least three Availability Zones (AZs).
*   **Database Resilience:**
    *   `EventStore`: Synchronous replication with at least 3 nodes (one leader, two followers).
    *   `Projections`: Multi-AZ read replicas to ensure dashboard uptime even if the primary projection DB fails.
*   **Self-Healing:** Kubernetes liveness/readiness probes restart unhealthy pods immediately.

---

## 5. Multi-Region/Geo-Distribution (Future Strategy)

To ensure low latency for global learners:

1.  **Geo-Partitioning:** Learner data (Session, Evidence, Competency) is pinned to the nearest region.
2.  **Global Backbone:** Kafka cluster replication (e.g., using MirrorMaker 2) synchronizes non-sensitive system events across regions for centralized analytics.
3.  **Local Authority:** All `SYS` events (truth) must be committed to the regional leader before being propagated.
