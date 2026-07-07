import { AppEvent, EventClass } from '../types.js';
import { saveEvent } from './event-store.js';

export type EventSubscriber = (event: AppEvent) => Promise<void>;

export const logger = {
  info: (msg, meta = {}) => {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  error: (msg, meta = {}) => {
    console.error(JSON.stringify({ level: 'ERROR', timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  warn: (msg, meta = {}) => {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), message: msg, ...meta }));
  }
};

class DomainEventDispatcher {
  private subscribers: Map<string, EventSubscriber[]> = new Map();

  subscribe(eventType: string, subscriber: EventSubscriber) {
    const handlers = this.subscribers.get(eventType) || [];
    handlers.push(subscriber);
    this.subscribers.set(eventType, handlers);
  }

  async dispatch(event: AppEvent) {
    // 1. Validation schema check
    if (!event.eventId || !event.eventType || !event.version || !event.timestamp || !event.actorId || !event.payload || !event.metadata) {
      logger.error('Invalid event schema: missing required fields', { eventType: event.eventType, eventId: event.eventId });
      throw new Error(`Invalid event schema for ${event.eventType}`);
    }

    logger.info('Dispatching event', {
      eventType: event.eventType,
      eventClass: event.metadata.class,
      traceId: event.metadata.traceId,
      correlationId: event.metadata.correlationId || event.metadata.traceId
    });
    
    // 2. Persist to Event Store
    await saveEvent(event);

    // 3. Trigger Subscribers
    const handlers = this.subscribers.get(event.eventType) || [];
    const wildcardHandlers = this.subscribers.get('*') || [];
    
    const allHandlers = [...handlers, ...wildcardHandlers];
    
    // Process asynchronously to decouple
    Promise.all(allHandlers.map(handler => 
      handler(event).catch(err => logger.error(`Error in subscriber for ${event.eventType}`, { error: err.message, traceId: event.metadata.traceId }))
    ));
  }
}

export const dispatcher = new DomainEventDispatcher();