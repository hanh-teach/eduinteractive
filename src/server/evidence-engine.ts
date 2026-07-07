import { dispatcher } from './dispatcher.js';
import { saveEvidence } from './evidence-store.js';
import { AppEvent, EventClass, EvidenceArtifact } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class EvidenceEngine {
  constructor() {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    dispatcher.subscribe('SYS.LEARNING.QUIZ_SUBMITTED', this.handleQuizEvidence.bind(this));
    dispatcher.subscribe('SYS.LEARNING.CODING_SUBMITTED', this.handleCodingEvidence.bind(this));
  }

  private async handleQuizEvidence(event: AppEvent) {
    const { correct, answer } = event.payload;
    console.log(`[EvidenceEngine] [TRACE: ${event.metadata.traceId || 'N/A'}] Processing quiz evidence for session ${event.sessionId}`);
    const evidence: EvidenceArtifact = {
      evidenceId: uuidv4(),
      sessionId: event.sessionId,
      studentId: event.actorId,
      competencyIds: ['python.logic.if_statements'],
      payload: { interactionType: 'quiz', outcome: correct ? 'SUCCESS' : 'FAILURE', details: { answer } },
      confidenceScore: correct ? 0.9 : 0.4,
      timestamp: new Date().toISOString()
    };
    await saveEvidence(evidence);
    await dispatcher.dispatch({
      eventId: uuidv4(),
      eventType: 'DERIVED.EVIDENCE.CREATED',
      version: '1.0.0',
      sessionId: event.sessionId,
      timestamp: new Date().toISOString(),
      actorId: 'EvidenceEngine',
      payload: evidence,
      metadata: { traceId: event.metadata.traceId, source: 'EvidenceEngine', class: EventClass.DERIVED }
    });
  }

  private async handleCodingEvidence(event: AppEvent) {
    const { code, correct } = event.payload;
    const evidence: EvidenceArtifact = {
      evidenceId: uuidv4(),
      sessionId: event.sessionId,
      studentId: event.actorId,
      competencyIds: ['python.logic.if_statements'],
      payload: { interactionType: 'coding', outcome: correct ? 'SUCCESS' : 'FAILURE', details: { code } },
      confidenceScore: correct ? 0.95 : 0.3,
      timestamp: new Date().toISOString()
    };
    await saveEvidence(evidence);
    await dispatcher.dispatch({
      eventId: uuidv4(),
      eventType: 'DERIVED.EVIDENCE.CREATED',
      version: '1.0.0',
      sessionId: event.sessionId,
      timestamp: new Date().toISOString(),
      actorId: 'EvidenceEngine',
      payload: evidence,
      metadata: { traceId: event.metadata.traceId, source: 'EvidenceEngine', class: EventClass.DERIVED }
    });
  }
}

export const evidenceEngine = new EvidenceEngine();
