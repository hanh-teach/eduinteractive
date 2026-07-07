import { LearningSessionState, SessionState } from '../types.js';
import { v4 as uuidv4 } from 'uuid';
import { db, isFirestoreFallback, cleanData } from './firebase.js';

const memorySessionsStore = new Map<string, LearningSessionState>();

// Telemetry state counters
let recreatedSessionsCount = 0;
let missingSessionsRequestsCount = 0;

// Track active sessions we processed during this process run for the count telemetry
const activeSessionsProcessed = new Set<string>();

export async function saveSessionState(state: LearningSessionState): Promise<void> {
  activeSessionsProcessed.add(state.sessionId);

  if (isFirestoreFallback || !db) {
    const existing = memorySessionsStore.get(state.sessionId);
    const generation = state.sessionGeneration ?? existing?.sessionGeneration ?? 0;
    const correlationId = state.correlationId ?? existing?.correlationId;

    memorySessionsStore.set(state.sessionId, {
      ...state,
      sessionRecreated: state.sessionRecreated ?? false,
      sessionRecovered: state.sessionRecovered ?? true,
      recreatedAt: state.recreatedAt || null,
      recoveryReason: state.recoveryReason || null,
      sessionVersion: state.sessionVersion ?? '1.0.0',
      sessionGeneration: generation,
      correlationId: correlationId || null,
      lastUpdated: new Date().toISOString()
    });
    return;
  }

  try {
    const docRef = db.collection('session_states').doc(state.sessionId);
    const docSnap = await docRef.get();
    const existing = docSnap.exists ? (docSnap.data() as LearningSessionState) : null;
    const generation = state.sessionGeneration ?? existing?.sessionGeneration ?? 0;
    const correlationId = state.correlationId ?? existing?.correlationId;

    const dataToSave: LearningSessionState = {
      ...state,
      sessionRecreated: state.sessionRecreated ?? false,
      sessionRecovered: state.sessionRecovered ?? true,
      recreatedAt: state.recreatedAt || null,
      recoveryReason: state.recoveryReason || null,
      sessionVersion: state.sessionVersion ?? '1.0.0',
      sessionGeneration: generation,
      correlationId: correlationId || null,
      lastUpdated: new Date().toISOString()
    };

    await docRef.set(cleanData(dataToSave));
  } catch (err) {
    console.error(`[SessionStore] Failed to save session state for ${state.sessionId} to Firestore. Falling back to memory.`, err);
    
    // Memory fallback update
    const existing = memorySessionsStore.get(state.sessionId);
    const generation = state.sessionGeneration ?? existing?.sessionGeneration ?? 0;
    const correlationId = state.correlationId ?? existing?.correlationId;

    memorySessionsStore.set(state.sessionId, {
      ...state,
      sessionRecreated: state.sessionRecreated ?? false,
      sessionRecovered: state.sessionRecovered ?? true,
      recreatedAt: state.recreatedAt || null,
      recoveryReason: state.recoveryReason || null,
      sessionVersion: state.sessionVersion ?? '1.0.0',
      sessionGeneration: generation,
      correlationId: correlationId || null,
      lastUpdated: new Date().toISOString()
    });
  }
}

// Regex to validate session ID UUID format to prevent arbitrary parameter attacks or dummy state initialization
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getSessionState(
  sessionId: string,
  correlationId?: string,
  clientGeneration?: number
): Promise<LearningSessionState | null> {
  if (!sessionId) return null;

  activeSessionsProcessed.add(sessionId);

  if (isFirestoreFallback || !db) {
    if (!memorySessionsStore.has(sessionId)) {
      // 1. Validate UUID format before recreation
      if (!UUID_REGEX.test(sessionId)) {
        console.warn(`[TELEMETRY] invalid_session_id_rejected: sessionId="${sessionId}" correlationId="${correlationId || 'N/A'}"`);
        return null;
      }

      missingSessionsRequestsCount++;
      recreatedSessionsCount++;

      // 2. Telemetry event logs
      console.warn(`[TELEMETRY] session_missing_restart_detected: sessionId=${sessionId} correlationId=${correlationId || 'N/A'}`);

      // Determine generation (increment client's reported generation, or start at 1)
      const newGeneration = (clientGeneration !== undefined && !isNaN(clientGeneration)) ? (clientGeneration + 1) : 1;

      // 3. Recreate session but mark with clear flags so frontend knows it's a recreated default session, not a fully-restored active session
      const defaultState: LearningSessionState = {
        sessionId: sessionId,
        studentId: 'student-123',
        currentObjectId: 'intro-video',
        state: SessionState.EXECUTING,
        context: { lessonId: 'python-if-intro', progress: 0 },
        lastUpdated: new Date().toISOString(),
        sessionRecreated: true,
        sessionRecovered: false,
        recreatedAt: new Date().toISOString(),
        recoveryReason: 'SERVER_RESTART',
        sessionVersion: '1.0.0',
        sessionGeneration: newGeneration,
        correlationId: correlationId || `recreate-${uuidv4().substring(0, 8)}`
      };
      
      memorySessionsStore.set(sessionId, defaultState);
      console.log(`[TELEMETRY] session_auto_initialized: sessionId=${sessionId}, total_recreated=${recreatedSessionsCount}, generation=${newGeneration}, correlationId=${defaultState.correlationId}`);
    } else if (correlationId) {
      // Associate active request's correlation ID for traceability
      const existing = memorySessionsStore.get(sessionId)!;
      existing.correlationId = correlationId;
    }
    return memorySessionsStore.get(sessionId) || null;
  }

  try {
    const docRef = db.collection('session_states').doc(sessionId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      // Check if it exists in memory first before full recreation
      if (memorySessionsStore.has(sessionId)) {
        const state = memorySessionsStore.get(sessionId)!;
        if (correlationId) {
          state.correlationId = correlationId;
        }
        await docRef.set(cleanData(state));
        return state;
      }

      // 1. Validate UUID format before recreation
      if (!UUID_REGEX.test(sessionId)) {
        console.warn(`[TELEMETRY] invalid_session_id_rejected: sessionId="${sessionId}" correlationId="${correlationId || 'N/A'}"`);
        return null;
      }

      missingSessionsRequestsCount++;
      recreatedSessionsCount++;

      // 2. Telemetry event logs
      console.warn(`[TELEMETRY] session_missing_restart_detected: sessionId=${sessionId} correlationId=${correlationId || 'N/A'}`);

      // Determine generation (increment client's reported generation, or start at 1)
      const newGeneration = (clientGeneration !== undefined && !isNaN(clientGeneration)) ? (clientGeneration + 1) : 1;

      // 3. Recreate session but mark with clear flags so frontend knows it's a recreated default session, not a fully-restored active session
      const defaultState: LearningSessionState = {
        sessionId: sessionId,
        studentId: 'student-123',
        currentObjectId: 'intro-video',
        state: SessionState.EXECUTING,
        context: { lessonId: 'python-if-intro', progress: 0 },
        lastUpdated: new Date().toISOString(),
        sessionRecreated: true,
        sessionRecovered: false,
        recreatedAt: new Date().toISOString(),
        recoveryReason: 'SERVER_RESTART',
        sessionVersion: '1.0.0',
        sessionGeneration: newGeneration,
        correlationId: correlationId || `recreate-${uuidv4().substring(0, 8)}`
      };
      
      await docRef.set(cleanData(defaultState));
      console.log(`[TELEMETRY] session_auto_initialized: sessionId=${sessionId}, total_recreated=${recreatedSessionsCount}, generation=${newGeneration}, correlationId=${defaultState.correlationId}`);
      return defaultState;
    } else {
      const state = docSnap.data() as LearningSessionState;
      if (correlationId && state.correlationId !== correlationId) {
        state.correlationId = correlationId;
        await docRef.update({ correlationId });
      }
      return state;
    }
  } catch (err) {
    console.error(`[SessionStore] Failed to get session state for ${sessionId} from Firestore. Falling back to memory.`, err);
    // Try to get from memory as fallback
    return memorySessionsStore.get(sessionId) || null;
  }
}

export function getSessionStoreTelemetry() {
  const sessionRecoveryRate = missingSessionsRequestsCount > 0 
    ? recreatedSessionsCount / missingSessionsRequestsCount 
    : 1.0;
  
  const activeCount = isFirestoreFallback || !db 
    ? memorySessionsStore.size 
    : activeSessionsProcessed.size;

  return {
    recreatedSessionsCount,
    missingSessionsRequestsCount,
    activeSessionsCount: activeCount,
    sessionRecoveryRate
  };
}
