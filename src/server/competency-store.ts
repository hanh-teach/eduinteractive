import { CompetencyState } from '../types.js';
import { db, isFirestoreFallback, cleanData } from './firebase.js';

const memoryCompetencyStore = new Map<string, CompetencyState>();

export async function saveCompetencyState(state: CompetencyState): Promise<void> {
  const docId = `${state.studentId}_${state.competencyId}`;
  const updatedState: CompetencyState = {
    ...state,
    lastUpdated: new Date().toISOString()
  };

  if (isFirestoreFallback || !db) {
    memoryCompetencyStore.set(docId, updatedState);
    return;
  }

  try {
    await db.collection('competency_states').doc(docId).set(cleanData(updatedState));
  } catch (err) {
    console.error(`[CompetencyStore] Failed to save competency state for student ${state.studentId}, competency ${state.competencyId} to Firestore. Falling back to memory.`, err);
    memoryCompetencyStore.set(docId, updatedState);
  }
}

export async function getStudentCompetency(studentId: string, competencyId: string): Promise<CompetencyState | null> {
  const docId = `${studentId}_${competencyId}`;

  if (isFirestoreFallback || !db) {
    return memoryCompetencyStore.get(docId) || null;
  }

  try {
    const docSnap = await db.collection('competency_states').doc(docId).get();
    if (docSnap.exists) {
      return docSnap.data() as CompetencyState;
    }
    // Fall back to memory
    return memoryCompetencyStore.get(docId) || null;
  } catch (err) {
    console.error(`[CompetencyStore] Failed to get competency state for student ${studentId}, competency ${competencyId} from Firestore. Falling back to memory.`, err);
    return memoryCompetencyStore.get(docId) || null;
  }
}

export async function getStudentCompetencies(studentId: string): Promise<CompetencyState[]> {
  if (isFirestoreFallback || !db) {
    const items: CompetencyState[] = [];
    for (const item of memoryCompetencyStore.values()) {
      if (item.studentId === studentId) {
        items.push(item);
      }
    }
    return items;
  }

  try {
    const snapshot = await db.collection('competency_states').where('studentId', '==', studentId).get();
    const items: CompetencyState[] = [];
    snapshot.forEach(doc => {
      items.push(doc.data() as CompetencyState);
    });

    // Merge memory values that are not in the query result for robustness
    for (const item of memoryCompetencyStore.values()) {
      if (item.studentId === studentId && !items.some(i => i.competencyId === item.competencyId)) {
        items.push(item);
      }
    }

    return items;
  } catch (err) {
    console.error(`[CompetencyStore] Failed to get competencies for student ${studentId} from Firestore. Falling back to memory.`, err);
    const items: CompetencyState[] = [];
    for (const item of memoryCompetencyStore.values()) {
      if (item.studentId === studentId) {
        items.push(item);
      }
    }
    return items;
  }
}
