import { PilotReadinessContract, RealityDriftIndex, PilotSuccessMetrics, AppEvent } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class PilotReadinessEngine {
  private currentContract: PilotReadinessContract | null = null;
  private driftHistory: Map<string, RealityDriftIndex[]> = new Map();

  public initializeContract(): PilotReadinessContract {
    this.currentContract = {
      id: uuidv4(),
      version: '1.0.0',
      scope: {
        gradeBand: 'Secondary',
        subject: 'Python Fundamentals',
        curriculumVersion: 'v1.0.0',
        cohortId: 'cohort-alpha'
      },
      gates: {
        minMasteryVelocity: 0.15,
        maxStateDivergence: 0.05,
        maxTeacherCognitiveLoad: 0.65,
        minHintIndependence: 0.70
      },
      status: 'SIGNED',
      timestamp: new Date().toISOString()
    };
    return this.currentContract;
  }

  public getContract(): PilotReadinessContract | null {
    return this.currentContract;
  }

  public calculateRDI(sessionId: string, metrics: PilotSuccessMetrics): RealityDriftIndex {
    // Reality Drift calculation logic
    const pedagogicalDivergence = Math.abs(0.25 - metrics.pedagogical.masteryVelocity) * 2;
    const scaffoldingAlignment = metrics.pedagogical.hintIndependence;
    const uiInducedFriction = metrics.humanExperience.interventionFatigue * 1.5;

    const compositeIndex = (pedagogicalDivergence * 0.4) + ((1 - scaffoldingAlignment) * 0.3) + (uiInducedFriction * 0.3);

    const rdi: RealityDriftIndex = {
      id: uuidv4(),
      sessionId,
      timestamp: new Date().toISOString(),
      pedagogicalDivergence,
      scaffoldingAlignment,
      uiInducedFriction,
      compositeIndex: Math.min(compositeIndex, 1.0)
    };

    const history = this.driftHistory.get(sessionId) || [];
    history.push(rdi);
    this.driftHistory.set(sessionId, history);

    return rdi;
  }

  public checkContractBreach(metrics: PilotSuccessMetrics): { breached: boolean; reason?: string } {
    if (!this.currentContract) return { breached: false };

    const { gates } = this.currentContract;
    
    if (metrics.pedagogical.masteryVelocity < gates.minMasteryVelocity) {
      return { breached: true, reason: 'Mastery velocity fell below contract gate' };
    }
    if (metrics.stability.stateDivergence > gates.maxStateDivergence) {
      return { breached: true, reason: 'System state divergence exceeded contract limit' };
    }
    if (metrics.humanExperience.teacherCognitiveLoad > gates.maxTeacherCognitiveLoad) {
      return { breached: true, reason: 'Teacher cognitive load exceeded safety gate' };
    }

    return { breached: false };
  }
}

export const pilotReadinessEngine = new PilotReadinessEngine();
