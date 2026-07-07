import { AppEvent } from '../types.js';
import { db, isFirestoreFallback, cleanData } from './firebase.js';

const memoryEventsStore = new Map<string, AppEvent>();

export async function saveEvent(event: AppEvent): Promise<void> {
  if (isFirestoreFallback || !db) {
    memoryEventsStore.set(event.eventId, event);
    return;
  }

  try {
    await db.collection('event_store').doc(event.eventId).set(cleanData(event));
  } catch (err) {
    console.error(`[EventStore] Failed to save event ${event.eventId} to Firestore. Falling back to memory.`, err);
    memoryEventsStore.set(event.eventId, event);
  }
}

export async function getSessionEvents(sessionId: string): Promise<AppEvent[]> {
  if (isFirestoreFallback || !db) {
    const events: AppEvent[] = [];
    for (const event of memoryEventsStore.values()) {
      if (event.sessionId === sessionId) {
        events.push(event);
      }
    }
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  try {
    const snapshot = await db.collection('event_store').where('sessionId', '==', sessionId).get();
    const events: AppEvent[] = [];
    snapshot.forEach(doc => {
      events.push(doc.data() as AppEvent);
    });

    // Merge in memory-only events for resiliency
    for (const event of memoryEventsStore.values()) {
      if (event.sessionId === sessionId && !events.some(e => e.eventId === event.eventId)) {
        events.push(event);
      }
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (err) {
    console.error(`[EventStore] Failed to query events for session ${sessionId} from Firestore. Falling back to memory.`, err);
    const events: AppEvent[] = [];
    for (const event of memoryEventsStore.values()) {
      if (event.sessionId === sessionId) {
        events.push(event);
      }
    }
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}
