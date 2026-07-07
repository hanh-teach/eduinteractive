import { dispatcher } from './dispatcher.js';
import { updateStudentSnapshot } from './classroom-store.js';
import { getSessionState } from './session-store.js';
import { getStudentCompetencies } from './competency-store.js';
import { AppEvent } from '../types.js';

export class ClassroomEngine {
  private classId = 'demo-class-1';

  constructor() {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Listen for any learning event to update classroom snapshot
    dispatcher.subscribe('*', this.handleEveryEvent.bind(this));
  }

  private async handleEveryEvent(event: AppEvent) {
    if (!event.sessionId) return;

    const sessionState = await getSessionState(event.sessionId);
    if (!sessionState) return;

    const competencies = await getStudentCompetencies(sessionState.studentId);
    
    // Create student snapshot
    await updateStudentSnapshot(this.classId, {
      studentId: sessionState.studentId,
      sessionId: event.sessionId,
      currentObjectId: sessionState.currentObjectId,
      lastActive: event.timestamp,
      status: sessionState.state,
      recentEvents: [], // Could slice recent events if needed
      competencies
    });
    
    console.log(`[ClassroomEngine] Snapshot updated for student ${sessionState.studentId}`);
  }
}

export const classroomEngine = new ClassroomEngine();
