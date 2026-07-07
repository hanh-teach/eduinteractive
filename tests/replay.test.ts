import { describe, it, expect, vi } from 'vitest';
import { dispatcher } from '../src/server/dispatcher';
import { getStudentCompetency } from '../src/server/competency-store';
import { EventClass } from '../src/types';
import '../src/server/evidence-engine'; 
import '../src/server/competency-engine'; 

describe('Deterministic Replay', () => {
  it('should deterministically update competency state from events', async () => {
    const sessionId = 'test-session-1';
    const studentId = 'test-student-1';
    
    const events = [
      {
        eventId: 'e1',
        eventType: 'SYS.LEARNING.QUIZ_SUBMITTED',
        version: '1.0',
        timestamp: new Date().toISOString(),
        actorId: studentId,
        sessionId,
        payload: { correct: true, answer: 'A' },
        metadata: { class: EventClass.AUTHORITATIVE, traceId: 't1' }
      },
      {
        eventId: 'e2',
        eventType: 'SYS.LEARNING.QUIZ_SUBMITTED',
        version: '1.0',
        timestamp: new Date().toISOString(),
        actorId: studentId,
        sessionId,
        payload: { correct: false, answer: 'B' },
        metadata: { class: EventClass.AUTHORITATIVE, traceId: 't2' }
      },
      {
        eventId: 'e3',
        eventType: 'SYS.LEARNING.QUIZ_SUBMITTED',
        version: '1.0',
        timestamp: new Date().toISOString(),
        actorId: studentId,
        sessionId,
        payload: { correct: true, answer: 'A' },
        metadata: { class: EventClass.AUTHORITATIVE, traceId: 't3' }
      }
    ];

    for (const event of events) {
      await dispatcher.dispatch(event as any);
    }
    
    // Wait for async handlers (evidence creation -> competency update)
    await new Promise(r => setTimeout(r, 1000));
    
    const compState = await getStudentCompetency(studentId, 'python.logic.if_statements');
    expect(compState).toBeDefined();
    expect(compState?.masteryVector.accuracy).toBeCloseTo(0.35, 2);
  });
});
