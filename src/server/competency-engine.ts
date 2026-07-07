import { dispatcher } from './dispatcher.js';
import { saveCompetencyState, getStudentCompetency } from './competency-store.js';
import { AppEvent, EventClass, CompetencyState, MasteryStage, EvidenceArtifact } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class CompetencyEngine {
  constructor() {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Listen for new evidence to update mastery
    dispatcher.subscribe('DERIVED.EVIDENCE.CREATED', this.handleEvidenceCreated.bind(this));
  }

  private async handleEvidenceCreated(event: AppEvent) {
    const evidence = event.payload as EvidenceArtifact;
    
    console.log(`[CompetencyEngine] [TRACE: ${event.metadata.traceId || 'N/A'}] Updating competency states from evidence ${evidence.evidenceId}`);

    for (const compId of evidence.competencyIds) {
      let state = await getStudentCompetency(evidence.studentId, compId);
      
      if (!state) {
        state = {
          studentId: evidence.studentId,
          competencyId: compId,
          masteryVector: {
            accuracy: 0,
            consistency: 0,
            transfer: 0,
            independence: 0,
            speed: 0
          },
          masteryStage: MasteryStage.EMERGING,
          lastUpdated: new Date().toISOString()
        };
      }

      // Logic: Update mastery vector based on evidence
      // Simple MVP logic: accuracy increases with success
      const isSuccess = evidence.payload.outcome === 'SUCCESS';
      const weight = 0.2; // Learning rate

      if (isSuccess) {
        state.masteryVector.accuracy = Math.min(1, state.masteryVector.accuracy + weight);
        state.masteryVector.consistency = Math.min(1, state.masteryVector.consistency + (weight / 2));
      } else {
        state.masteryVector.accuracy = Math.max(0, state.masteryVector.accuracy - (weight / 4));
      }

      // Determine stage
      if (state.masteryVector.accuracy > 0.8) state.masteryStage = MasteryStage.MASTERY;
      else if (state.masteryVector.accuracy > 0.6) state.masteryStage = MasteryStage.PROFICIENT;
      else if (state.masteryVector.accuracy > 0.3) state.masteryStage = MasteryStage.DEVELOPING;
      else state.masteryStage = MasteryStage.EMERGING;

      state.lastUpdated = new Date().toISOString();
      await saveCompetencyState(state);

      // Emit DERIVED event for competency update
      await dispatcher.dispatch({
        eventId: uuidv4(),
        eventType: 'DERIVED.COMPETENCY.UPDATED',
        version: '1.0.0',
        sessionId: evidence.sessionId,
        timestamp: new Date().toISOString(),
        actorId: 'CompetencyEngine',
        payload: state,
        metadata: {
          traceId: event.metadata.traceId,
          source: 'CompetencyEngine',
          class: EventClass.DERIVED
        }
      });
    }
  }
}

export const competencyEngine = new CompetencyEngine();
