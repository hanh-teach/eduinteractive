import { dispatcher } from './dispatcher.js';
import { AppEvent, OptimizationMetrics, EffectivenessScore } from '../types.js';
import { getSessionState } from './session-store.js';

export class OptimizationEngine {
  private metrics: OptimizationMetrics = {
    curriculumEffectiveness: {},
    hintImpact: {},
    lastCalculated: new Date().toISOString()
  };

  // Internal counters to calculate averages/rates
  private counters: Record<string, { success: number; total: number; totalTime: number }> = {};

  constructor() {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Listen for events that indicate success or failure after an interaction
    dispatcher.subscribe('SYS.LEARNING.QUIZ_SUBMITTED', this.trackQuizOutcome.bind(this));
    dispatcher.subscribe('ADVISORY.AI.HINT_OFFERED', this.trackHintExposure.bind(this));
    dispatcher.subscribe('DERIVED.SESSION.ADAPTIVE_TRANSITION', this.trackTransition.bind(this));
  }

  private async trackQuizOutcome(event: AppEvent) {
    const sessionState = await getSessionState(event.sessionId);
    if (!sessionState) return;

    const objId = sessionState.currentObjectId;
    const isSuccess = event.payload.correct;

    this.updateCounter(`OBJ:${objId}`, isSuccess);
    this.calculateMetrics();
  }

  private async trackHintExposure(event: AppEvent) {
    const hintId = event.payload.competencyId; // Simplified ID
    // We track that a hint was given. Success is determined by subsequent student actions.
    this.updateCounter(`HINT:${hintId}`, false, 0, true); // Just increment total
  }

  private async trackTransition(event: AppEvent) {
    // If transition was successful, it might be due to a previous hint
    if (event.payload.reason === 'onSuccess') {
      // In a real system, we'd look back at the trace to see if a hint preceded this
      // For this demo, we'll assume the most recent hint for this competency was helpful
      this.updateCounter(`HINT:${event.payload.from}`, true);
    }
  }

  private updateCounter(id: string, success: boolean, time = 0, incrementTotalOnly = false) {
    if (!this.counters[id]) {
      this.counters[id] = { success: 0, total: 0, totalTime: 0 };
    }
    
    this.counters[id].total++;
    if (!incrementTotalOnly && success) {
      this.counters[id].success++;
    }
    this.counters[id].totalTime += time;
  }

  private calculateMetrics() {
    for (const [id, stats] of Object.entries(this.counters)) {
      const score: EffectivenessScore = {
        id: id.split(':')[1],
        type: id.startsWith('OBJ') ? 'LEARNING_OBJECT' : 'AI_HINT',
        successRate: stats.success / (stats.total || 1),
        avgTimeSpent: stats.totalTime / (stats.total || 1),
        struggleRate: (stats.total - stats.success) / (stats.total || 1),
        sampleSize: stats.total
      };

      if (id.startsWith('OBJ')) {
        this.metrics.curriculumEffectiveness[score.id] = score;
      } else {
        this.metrics.hintImpact[score.id] = score;
      }
    }
    this.metrics.lastCalculated = new Date().toISOString();
  }

  public getMetrics(): OptimizationMetrics {
    return this.metrics;
  }
}

export const optimizationEngine = new OptimizationEngine();
