import { v4 as uuidv4 } from 'uuid';
import { PilotSession, ObservationLog, EventClass } from '../types.js';
import { dispatcher } from './dispatcher.js';
import { pilotMetricEngine } from './pilot-metric-engine.js';

export class PilotManager {
  private activeSessions: Map<string, PilotSession> = new Map();
  private logs: ObservationLog[] = [];

  constructor() {
    dispatcher.subscribe('*', async (event) => {
      // If we find an active pilot session for this sessionId, update metrics
      if (this.activeSessions.has(event.sessionId)) {
        pilotMetricEngine.updateFromEvent(event.sessionId, event);
        
        // Check for safety thresholds
        const safety = pilotMetricEngine.checkSafetyThresholds(event.sessionId);
        if (safety.triggerRollback) {
          this.triggerEmergencyRollback(event.sessionId, safety.reason!);
        }
      }
    });
  }

  private triggerEmergencyRollback(sessionId: string, reason: string) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    console.error(`[PilotSafety] EMERGENCY ROLLBACK TRIGGERED: ${reason}`);
    session.status = 'PAUSED';
    
    this.addObservation(sessionId, {
      type: 'TECHNICAL',
      severity: 'CRITICAL',
      content: `SAFETY TRIGGER: Emergency Rollback initiated. Reason: ${reason}`,
      actorId: 'SYSTEM'
    });
  }

  public startSession(classId: string): PilotSession {
    const session: PilotSession = {
      id: uuidv4(),
      classId,
      startTime: new Date().toISOString(),
      status: 'ACTIVE',
      observationNotes: [],
      manualOverrides: 0
    };
    this.activeSessions.set(session.id, session);
    
    dispatcher.dispatch({
      eventId: uuidv4(),
      eventType: 'SYS.PILOT.SESSION_STARTED',
      version: '1.0',
      sessionId: session.id,
      timestamp: session.startTime,
      actorId: 'SYSTEM',
      payload: { classId },
      metadata: { 
        traceId: uuidv4(), 
        source: 'pilot-manager',
        class: EventClass.SYSTEM
      }
    });

    return session;
  }

  public addObservation(sessionId: string, log: Partial<ObservationLog>): ObservationLog {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const observation: ObservationLog = {
      id: uuidv4(),
      sessionId,
      timestamp: new Date().toISOString(),
      type: log.type || 'PEDAGOGICAL',
      severity: log.severity || 'INFO',
      content: log.content || '',
      actorId: log.actorId || 'TEACHER'
    };

    this.logs.push(observation);
    
    if (observation.severity === 'CRITICAL') {
      session.manualOverrides++;
    }

    return observation;
  }

  public getSession(sessionId: string): PilotSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  public getLogs(sessionId: string): ObservationLog[] {
    return this.logs.filter(l => l.sessionId === sessionId);
  }
}

export const pilotManager = new PilotManager();
