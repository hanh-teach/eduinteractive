import { describe, it, expect } from 'vitest';
import { dispatcher } from '../src/server/dispatcher';
import { EventClass } from '../src/types';

describe('Dispatcher Schema Validation', () => {
  it('should reject events missing required fields', async () => {
    const invalidEvent = {
      // Missing eventId, version, timestamp, actorId, payload, metadata
      eventType: 'TEST.EVENT',
    } as any;

    await expect(dispatcher.dispatch(invalidEvent)).rejects.toThrow('Invalid event schema');
  });

  it('should accept valid events', async () => {
    const validEvent = {
      eventId: '123',
      eventType: 'TEST.EVENT',
      version: '1.0',
      timestamp: new Date().toISOString(),
      actorId: 'tester',
      payload: {},
      metadata: { class: EventClass.AUTHORITATIVE }
    } as any;

    // We shouldn't actually hit Firestore in tests if possible, but dispatcher calls saveEvent which might hit firestore.
    // Let's mock saveEvent if needed, or just let it try if it uses fallback in-memory DB when no Firebase env var is set.
    // For now, let's just see if it doesn't throw the validation error.
    await expect(dispatcher.dispatch(validEvent)).resolves.not.toThrow();
  });
});
