import { dispatcher } from './dispatcher.js';
import { saveSessionState, getSessionState } from './session-store.js';
import { getNextObject, getLearningObject } from './curriculum-store.js';
import { AppEvent, SessionState, EventClass } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class LearningRuntimeEngine {
  constructor() {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Listen for session start
    dispatcher.subscribe('SESSION.STARTED', this.handleSessionStarted.bind(this));
    
    // Listen for student interactions to progress state
    dispatcher.subscribe('SYS.LEARNING.QUIZ_SUBMITTED', this.handleQuizSubmitted.bind(this));
    dispatcher.subscribe('SYS.LEARNING.VIDEO_COMPLETED', this.handleVideoCompleted.bind(this));
    dispatcher.subscribe('SYS.LEARNING.CODING_SUBMITTED', this.handleCodingSubmitted.bind(this));

    // Listen for System Interventions
    dispatcher.subscribe('COMMAND.INTERVENTION.FORCED_PAUSE', this.handleForcedPause.bind(this));
  }

  private async handleForcedPause(event: AppEvent) {
    const state = await getSessionState(event.sessionId);
    if (!state) return;

    console.log(`[RuntimeEngine] Execution of session ${event.sessionId} SUSPENDED by Pedagogical Authority.`);
    state.state = SessionState.SUSPENDED;
    await saveSessionState(state);
  }

  private async handleSessionStarted(event: AppEvent) {
    const { studentId, lessonId } = event.payload;
    
    const initialState: any = {
      sessionId: event.sessionId,
      studentId,
      currentObjectId: 'intro-video',
      state: SessionState.EXECUTING,
      context: { lessonId, progress: 0 },
      lastUpdated: new Date().toISOString()
    };

    await saveSessionState(initialState);
    console.log(`[RuntimeEngine] Session ${event.sessionId} initialized and executing.`);
  }

  private async handleVideoCompleted(event: AppEvent) {
    await this.transitionState(event.sessionId, 'onSuccess', event.metadata.traceId);
  }

  private async handleQuizSubmitted(event: AppEvent) {
    const outcome = event.payload.correct ? 'onSuccess' : 'onFailure';
    await this.transitionState(event.sessionId, outcome, event.metadata.traceId);
  }


  private async handleCodingSubmitted(event: AppEvent) {
    const outcome = event.payload.correct ? 'onSuccess' : 'onFailure';
    // If it's correct we transition, if not we maybe transition to a struggle path or stay?
    // Let's just transition to onSuccess if correct, otherwise stay (return early)
    if (outcome === 'onSuccess') {
      await this.transitionState(event.sessionId, outcome, event.metadata.traceId);
    }
  }
  private async transitionState(sessionId: string, outcome: 'onSuccess' | 'onFailure', traceId: string) {
    const state = await getSessionState(sessionId);
    if (!state) return;

    const nextId = getNextObject(state.currentObjectId, outcome);
    
    if (nextId) {
      console.log(`[RuntimeEngine] Transitioning ${sessionId} from ${state.currentObjectId} to ${nextId} (${outcome})`);
      state.currentObjectId = nextId;
      
      // Emit a DERIVED event for the adaptive transition
      await dispatcher.dispatch({
        eventId: uuidv4(),
        eventType: 'DERIVED.SESSION.ADAPTIVE_TRANSITION',
        version: '1.0.0',
        sessionId,
        timestamp: new Date().toISOString(),
        actorId: 'RuntimeEngine',
        payload: { 
          from: state.currentObjectId, 
          to: nextId, 
          reason: outcome 
        },
        metadata: {
          traceId,
          source: 'LearningRuntimeEngine',
          class: EventClass.DERIVED
        }
      });

      await saveSessionState(state);
    }
  }
}

export const runtimeEngine = new LearningRuntimeEngine();
