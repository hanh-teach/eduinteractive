export enum EventClass {
  SYSTEM = 'SYS',
  DERIVED = 'DERIVED',
  ADVISORY = 'ADVISORY',
  AUTHORITATIVE = 'AUTHORITATIVE'
}

export interface AppEvent<T = any> {
  eventId: string;
  eventType: string;
  version: string;
  sessionId: string;
  timestamp: string;
  actorId: string;
  payload: T;
  metadata: {
    traceId: string;
    correlationId?: string;
    source: string;
    class: EventClass;
    origin?: 'synthetic' | 'organic';
  };
}

export enum SessionState {
  READY = 'READY',
  EXECUTING = 'EXECUTING',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED'
}

export interface LearningSessionState {
  sessionId: string;
  studentId: string;
  currentObjectId: string;
  state: SessionState;
  context: Record<string, any>;
  lastUpdated: string;
  sessionRecreated?: boolean;
  sessionRecovered?: boolean;
  recreatedAt?: string;
  recoveryReason?: 'SERVER_RESTART' | 'SESSION_EXPIRED' | 'CACHE_LOST' | 'MANUAL_RESET' | 'UNKNOWN';
  sessionVersion?: string;
  sessionGeneration?: number;
  correlationId?: string;
}

export interface EvidenceArtifact {
  evidenceId: string;
  sessionId: string;
  studentId: string;
  competencyIds: string[];
  payload: any;
  confidenceScore: number;
  timestamp: string;
}

export enum MasteryStage {
  EMERGING = 'Emerging',
  DEVELOPING = 'Developing',
  PROFICIENT = 'Proficient',
  MASTERY = 'Mastery'
}

export enum InteractionType {
  VIDEO = 'VIDEO',
  QUIZ = 'QUIZ',
  CODING = 'CODING',
  DEMO = 'DEMO',
  SUMMARY = 'SUMMARY'
}

export interface LearningObject {
  id: string;
  type: InteractionType;
  title: string;
  description: string;
  competencyId: string;
  metadata: Record<string, any>;
}

export interface CurriculumNode {
  objectId: string;
  next: {
    onSuccess?: string;
    onFailure?: string;
    onStruggle?: string;
  };
}

export enum AuthorityLevel {
  SYSTEM = 'SYSTEM',
  CURRICULUM = 'CURRICULUM',
  TEACHER = 'TEACHER',
  AI = 'AI',
  STUDENT = 'STUDENT'
}

export interface PolicyRule {
  id: string;
  actionType: string;
  permittedAuthorities: AuthorityLevel[];
  priority: number;
}

export interface InterventionRequest {
  id: string;
  sessionId: string;
  requester: AuthorityLevel;
  action: string;
  payload: any;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  timestamp: string;
}

export interface EffectivenessScore {
  id: string;
  type: 'LEARNING_OBJECT' | 'AI_HINT' | 'INTERVENTION';
  successRate: number;
  avgTimeSpent: number;
  struggleRate: number;
  sampleSize: number;
}

export interface CurriculumVersion {
  versionId: string;
  timestamp: string;
  author: string;
  graph: any;
  objects: any;
  status: 'ACTIVE' | 'ARCHIVED' | 'STAGED';
}

export interface CurriculumEvolutionProposal {
  id: string;
  timestamp: string;
  analysis: string;
  suggestedChanges: {
    objectId: string;
    action: 'REORDER' | 'REPLACE' | 'ADD_BRANCH';
    details: string;
    confidence: number;
  }[];
  simulationResults?: SimulationResult;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface SimulationResult {
  predictedSuccessRate: number;
  predictedCompletionTime: number;
  improvementDelta: number;
}

export interface OptimizationMetrics {
  curriculumEffectiveness: Record<string, EffectivenessScore>;
  hintImpact: Record<string, EffectivenessScore>;
  lastCalculated: string;
}

export interface ScientificValidationProtocol {
  version: string;
  status: 'PREPARATION' | 'DATA_GATHERING' | 'ANALYSIS' | 'CONCLUDED';
  controlGroupSetup: string;
  minimumSampleSize: number;
  targetGtci: number; // e.g., 0.8
}

export interface ExternalBlindTestResult {
  id: string;
  studentId: string;
  sessionId: string;
  score: number; // 0-1
  evaluatorId: string; // 'EXTERNAL_HUMAN' | 'STANDARDIZED_TEST'
  timestamp: string;
}

export interface GroundTruthCorrelationIndex {
  sessionId: string;
  timestamp: string;
  correlationScore: number; // 0-1
  sampleSize: number;
  systemMasteryAverage: number;
  externalScoreAverage: number;
  status: 'VALIDATED' | 'UNCORRELATED' | 'INVERTED' | 'INSUFFICIENT_DATA';
}

export interface ControlledExposureProtocol {
  id: string;
  status: 'ISOLATED' | 'EXPOSED' | 'LEAKAGE_DETECTED' | 'COMPROMISED';
  antiGamingConstraints: {
    dashboardBlindness: boolean;
    hintDelayEnforcement: boolean;
    competencyObfuscation: boolean;
  };
  leakageMetrics: {
    gamingAttemptsDetected: number;
    teacherInterventionBias: number;
    systemAdaptationVelocity: number;
  };
  isolationIntegrityScore: number;
}

export interface BehavioralStressTestProtocol {
  id: string;
  status: 'PREPARATION' | 'ACTIVE' | 'CONCLUDED';
  vulnerabilityScore: number;
  simulations: {
    adversarialTeacher: { status: 'DETECTED' | 'MITIGATED' | 'EXPLOITED'; impact: number };
    studentStrategicGaming: { status: 'DETECTED' | 'MITIGATED' | 'EXPLOITED'; impact: number };
    metricDeception: { status: 'DETECTED' | 'MITIGATED' | 'EXPLOITED'; impact: number };
    socialPressureDrift: { status: 'DETECTED' | 'MITIGATED' | 'EXPLOITED'; impact: number };
  };
  systemResilience: number;
}

export interface PilotReadinessContract {
  id: string;
  version: string;
  scope: {
    gradeBand: string;
    subject: string;
    curriculumVersion: string;
    cohortId: string;
  };
  gates: {
    minMasteryVelocity: number;
    maxStateDivergence: number;
    maxTeacherCognitiveLoad: number;
    minHintIndependence: number;
  };
  status: 'PENDING' | 'SIGNED' | 'ACTIVE' | 'BREACHED' | 'TERMINATED';
  timestamp: string;
}

export interface RealityDriftIndex {
  id: string;
  sessionId: string;
  timestamp: string;
  pedagogicalDivergence: number; // Difference between intended and observed behavior
  scaffoldingAlignment: number; // AI hint accuracy to student level
  uiInducedFriction: number; // Unexpected navigation/interaction patterns
  compositeIndex: number; // Overall RDI (0-1, where >0.4 is critical)
}

export interface PilotSession {
  id: string;
  classId: string;
  startTime: string;
  endTime?: string;
  status: 'PREPARING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  observationNotes: string[];
  manualOverrides: number;
}

export interface PilotSuccessMetrics {
  sessionId: string;
  timestamp: string;
  pedagogical: {
    masteryVelocity: number;
    hintIndependence: number;
    errorResilience: number;
    completionRate: number;
  };
  stability: {
    eventLatency: number;
    stateDivergence: number;
    throughput: number;
  };
  safety: {
    policyCompliantInterventions: number;
    authorityViolationAttempts: number;
    emergencyRollbackCount: number;
  };
  humanExperience: {
    teacherCognitiveLoad: number; // 0-1
    interventionFatigue: number; // 0-1
    systemTrustScore: number; // 0-1
  };
  overallStatus: 'EXCELLENT' | 'STABLE' | 'DEGRADED' | 'FAILED';
}

export interface PilotSuccessThresholds {
  minMasteryVelocity: number;
  maxStateDivergence: number;
  minHintIndependence: number;
  maxTeacherCognitiveLoad: number;
}

export interface ObservationLog {
  id: string;
  sessionId: string;
  timestamp: string;
  type: 'PEDAGOGICAL' | 'TECHNICAL' | 'BEHAVIORAL';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  content: string;
  actorId: string;
}

export interface StressTestScenario {
  id: string;
  name: string;
  description: string;
  type: 'STUDENT_FATIGUE' | 'CURRICULUM_BOTTLENECK' | 'SYSTEM_LATENCY' | 'ADVISORY_DRIFT' | 'POLICY_EROSION' | 'CURRICULUM_DEADLOCK';
  intensity: number;
}

export interface FailureModeMetric {
  id: string;
  name: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NOMINAL' | 'DEGRADED' | 'FAILED';
  description: string;
}

export interface StressTestResult {
  scenarioId: string;
  timestamp: string;
  impactScore: number;
  policyViolations: number;
  learningVelocityDelta: number;
  systemStability: 'STABLE' | 'DEGRADED' | 'CRITICAL';
  failureMatrix: FailureModeMetric[];
}

export interface LearningSLO {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: 'percent' | 'seconds' | 'ratio';
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface SystemHealthReport {
  timestamp: string;
  uptime: number;
  learningSLOs: LearningSLO[];
  eventThroughput: number;
  activeSessions: number;
  averageCompetencyLatencyMs: number;
  aiHintRealCount: number;
  aiHintFallbackCount: number;
  sessionStoreTelemetry?: {
    recreatedSessionsCount: number;
    missingSessionsRequestsCount: number;
    activeSessionsCount: number;
    sessionRecoveryRate: number; // Percentage of missing session requests successfully auto-recovered (0.0 to 1.0)
  };
}

export interface StudentSnapshot {
  studentId: string;
  sessionId: string;
  currentObjectId: string;
  lastActive: string;
  status: SessionState;
  recentEvents: AppEvent[];
  competencies: CompetencyState[];
}

export interface ClassroomState {
  classId: string;
  activeStudents: Record<string, StudentSnapshot>;
  aggregates: {
    averageAccuracy: number;
    stugglingCount: number;
    completionRate: number;
  };
}

export interface CompetencyState {
  studentId: string;
  competencyId: string;
  masteryVector: {
    accuracy: number;
    consistency: number;
    transfer: number;
    independence: number;
    speed: number;
  };
  masteryStage: MasteryStage;
  lastUpdated: string;
}
