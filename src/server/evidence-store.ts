import { EvidenceArtifact } from '../types.js';
import { db, isFirestoreFallback, cleanData } from './firebase.js';

const memoryEvidenceStore = new Map<string, EvidenceArtifact>();

export async function saveEvidence(evidence: EvidenceArtifact): Promise<void> {
  if (isFirestoreFallback || !db) {
    memoryEvidenceStore.set(evidence.evidenceId, evidence);
    return;
  }

  try {
    await db.collection('evidence_artifacts').doc(evidence.evidenceId).set(cleanData(evidence));
  } catch (err) {
    console.error(`[EvidenceStore] Failed to save evidence ${evidence.evidenceId} to Firestore. Falling back to memory.`, err);
    memoryEvidenceStore.set(evidence.evidenceId, evidence);
  }
}

export async function getSessionEvidence(sessionId: string): Promise<EvidenceArtifact[]> {
  if (isFirestoreFallback || !db) {
    const items: EvidenceArtifact[] = [];
    for (const item of memoryEvidenceStore.values()) {
      if (item.sessionId === sessionId) {
        items.push(item);
      }
    }
    return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  try {
    const snapshot = await db.collection('evidence_artifacts').where('sessionId', '==', sessionId).get();
    const items: EvidenceArtifact[] = [];
    snapshot.forEach(doc => {
      items.push(doc.data() as EvidenceArtifact);
    });

    // Merge in memory-only items for resiliency
    for (const item of memoryEvidenceStore.values()) {
      if (item.sessionId === sessionId && !items.some(i => i.evidenceId === item.evidenceId)) {
        items.push(item);
      }
    }

    return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (err) {
    console.error(`[EvidenceStore] Failed to query evidence for session ${sessionId} from Firestore. Falling back to memory.`, err);
    const items: EvidenceArtifact[] = [];
    for (const item of memoryEvidenceStore.values()) {
      if (item.sessionId === sessionId) {
        items.push(item);
      }
    }
    return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}
