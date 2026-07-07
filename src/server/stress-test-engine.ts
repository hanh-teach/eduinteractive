import { dispatcher } from './dispatcher.js';
import { getClassroomState } from './classroom-store.js';
import { StressTestScenario, StressTestResult, AppEvent, EventClass } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class StressTestEngine {
  private activeScenarios: Map<string, StressTestScenario> = new Map();

  public async runScenario(scenario: StressTestScenario): Promise<StressTestResult> {
    console.log(`[StressTester] Launching scenario: ${scenario.name} (Intensity: ${scenario.intensity})`);
    this.activeScenarios.set(scenario.id, scenario);

    // Simulate behavior based on scenario
    if (scenario.type === 'STUDENT_FATIGUE') {
      await this.simulateStudentFatigue(scenario.intensity);
    } else if (scenario.type === 'CURRICULUM_BOTTLENECK') {
      this.simulateBottleneck(scenario.intensity);
    } else if (scenario.type === 'ADVISORY_DRIFT') {
      this.simulateAdvisoryDrift(scenario.intensity);
    } else if (scenario.type === 'POLICY_EROSION') {
      this.simulatePolicyErosion(scenario.intensity);
    }

    // Return a simulated result reflecting the "Failure Mode Matrix"
    return {
      scenarioId: scenario.id,
      timestamp: new Date().toISOString(),
      impactScore: scenario.intensity * 0.8,
      policyViolations: Math.floor(scenario.intensity * 5),
      learningVelocityDelta: -scenario.intensity * 0.25,
      systemStability: scenario.intensity > 0.7 ? 'CRITICAL' : (scenario.intensity > 0.4 ? 'DEGRADED' : 'STABLE'),
      failureMatrix: [
        {
          id: 'pedagogical-integrity',
          name: 'Pedagogical Integrity',
          riskLevel: scenario.type === 'POLICY_EROSION' ? 'HIGH' : 'LOW',
          status: scenario.intensity > 0.6 && scenario.type === 'POLICY_EROSION' ? 'DEGRADED' : 'NOMINAL',
          description: 'Drift between system actions and core pedagogical philosophy.'
        },
        {
          id: 'ai-trust-index',
          name: 'AI Trust Index',
          riskLevel: scenario.type === 'ADVISORY_DRIFT' ? 'CRITICAL' : 'LOW',
          status: scenario.intensity > 0.5 && scenario.type === 'ADVISORY_DRIFT' ? 'FAILED' : 'NOMINAL',
          description: 'Reliability of AI-generated scaffolding and hints.'
        },
        {
          id: 'state-determinism',
          name: 'State Determinism',
          riskLevel: scenario.type === 'SYSTEM_LATENCY' ? 'MEDIUM' : 'LOW',
          status: scenario.intensity > 0.8 ? 'DEGRADED' : 'NOMINAL',
          description: 'Consistency of learning state across distributed events.'
        }
      ]
    };
  }

  private async simulateStudentFatigue(intensity: number) {
    // Inject events representing poor performance
    const state = await getClassroomState('demo-class-1');
    Object.keys(state.activeStudents).forEach(studentId => {
      if (Math.random() < intensity) {
        dispatcher.dispatch({
          eventId: uuidv4(),
          eventType: 'SYS.LEARNING.QUIZ_SUBMITTED',
          version: '1.0',
          sessionId: state.activeStudents[studentId].sessionId,
          timestamp: new Date().toISOString(),
          actorId: studentId,
          payload: { objectId: 'quiz-1', correct: false, timeSpent: 300 },
          metadata: {
            traceId: uuidv4(),
            source: 'stress-tester',
            class: EventClass.SYSTEM
          }
        });
      }
    });
  }

  private simulateAdvisoryDrift(intensity: number) {
    console.log(`[StressTester] Simulating AI Advisory Drift at ${intensity} intensity`);
    // In a real system, this would override AI weights to produce "bad" hints
  }

  private simulatePolicyErosion(intensity: number) {
    console.log(`[StressTester] Simulating Policy Engine Erosion at ${intensity} intensity`);
    // Simulate bypassing the policy engine for interventions
  }

  private simulateBottleneck(intensity: number) {
    // Simulate system latency or curriculum blocking
    console.log(`[StressTester] Simulating curriculum bottleneck at ${intensity} intensity`);
  }
}

export const stressTestEngine = new StressTestEngine();
