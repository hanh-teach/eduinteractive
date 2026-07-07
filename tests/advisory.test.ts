import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advisoryEngine } from '../src/server/advisory-engine';
import { dispatcher } from '../src/server/dispatcher';
import { MasteryStage, EventClass } from '../src/types';

describe('AdvisoryEngine AI Boundary', () => {
  beforeEach(() => {
    vi.spyOn(dispatcher, 'dispatch');
  });

  it('should only dispatch ADVISORY events and not modify states directly', async () => {
    const mockCompetencyState = {
      studentId: 'test-student',
      competencyId: 'python.logic.if_statements',
      masteryVector: { accuracy: 0.3, consistency: 0, transfer: 0, independence: 0, speed: 0 },
      masteryStage: MasteryStage.EMERGING,
      lastUpdated: new Date().toISOString()
    };

    // Simulate an event that triggers the engine
    const triggerEvent = {
      eventId: 'test-e1',
      eventType: 'DERIVED.COMPETENCY.UPDATED',
      version: '1.0',
      timestamp: new Date().toISOString(),
      actorId: 'test-student',
      sessionId: 'session-1',
      payload: mockCompetencyState,
      metadata: { class: EventClass.DERIVED, traceId: 't1' }
    };

    // We can directly call the private method if we ignore TS, but we can also just dispatch to the system
    // Wait, let's call evaluatePedagogy by simulating the dispatch.
    // Instead of actual dispatching through the whole system, let's just use the dispatcher.
    
    // We mock dispatch, so we need a way to invoke the subscriber. We can just invoke it.
    // @ts-ignore
    await advisoryEngine.evaluatePedagogy(triggerEvent);

    // Assert that dispatch was called
    expect(dispatcher.dispatch).toHaveBeenCalled();

    const dispatchCalls = vi.mocked(dispatcher.dispatch).mock.calls;
    
    // Check that every dispatched event from this engine starts with 'ADVISORY.'
    for (const call of dispatchCalls) {
      const eventType = call[0].eventType;
      expect(eventType.startsWith('ADVISORY.')).toBe(true);
    }
  });
});
