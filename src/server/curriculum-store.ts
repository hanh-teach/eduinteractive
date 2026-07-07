import { LearningObject, InteractionType, CurriculumNode } from '../types.js';
import { db, isFirestoreFallback, cleanData } from './firebase.js';

export let LEARNING_OBJECTS: Record<string, LearningObject> = {
  'intro-video': {
    id: 'intro-video',
    type: InteractionType.VIDEO,
    title: 'Welcome to Python Logic',
    description: 'Learn the basics of branching logic.',
    competencyId: 'python.logic.intro',
    metadata: { duration: 180 }
  },
  'quiz-1': {
    id: 'quiz-1',
    type: InteractionType.QUIZ,
    title: 'Conditional Concept Check',
    description: 'Test your understanding of the "if" statement.',
    competencyId: 'python.logic.if_statements',
    metadata: { questions: 3 }
  },
  'coding-1': {
    id: 'coding-1',
    type: InteractionType.CODING,
    title: 'Hero Decision Script',
    description: 'Write a script that decides which path the hero takes.',
    competencyId: 'python.logic.if_statements',
    metadata: { language: 'python' }
  },
  'summary': {
    id: 'summary',
    type: InteractionType.SUMMARY,
    title: 'Lesson Summary',
    description: 'Review your progress and get AI recommendations.',
    competencyId: 'python.logic.if_statements',
    metadata: {}
  },
  'review-video': {
    id: 'review-video',
    type: InteractionType.VIDEO,
    title: 'If-Else Deep Dive',
    description: 'A more detailed look at nested conditions.',
    competencyId: 'python.logic.if_statements',
    metadata: { duration: 300 }
  }
};

export let CURRICULUM_GRAPH: Record<string, CurriculumNode> = {
  'intro-video': {
    objectId: 'intro-video',
    next: { onSuccess: 'quiz-1' }
  },
  'quiz-1': {
    objectId: 'quiz-1',
    next: { 
      onSuccess: 'coding-1',
      onFailure: 'review-video' // Adaptive branch on failure
    }
  },
  'review-video': {
    objectId: 'review-video',
    next: { onSuccess: 'quiz-1' } // Loop back after review
  },
  'coding-1': {
    objectId: 'coding-1',
    next: { onSuccess: 'summary' } 
  },
  'summary': {
    objectId: 'summary',
    next: {}
  }
};

async function initFromFirestore() {
  if (isFirestoreFallback || !db) return;

  try {
    const objectsSnap = await db.collection('curriculum_objects').get();
    if (objectsSnap.empty) {
      // Seed initial learning objects
      const batch = db.batch();
      for (const [id, obj] of Object.entries(LEARNING_OBJECTS)) {
        batch.set(db.collection('curriculum_objects').doc(id), cleanData(obj));
      }
      await batch.commit();
      console.log('[CurriculumStore] Seeded initial learning objects to Firestore.');
    } else {
      const loadedObjects: Record<string, LearningObject> = {};
      objectsSnap.forEach(doc => {
        loadedObjects[doc.id] = doc.data() as LearningObject;
      });
      LEARNING_OBJECTS = loadedObjects;
      console.log(`[CurriculumStore] Loaded ${Object.keys(loadedObjects).length} learning objects from Firestore.`);
    }

    const graphSnap = await db.collection('curriculum_graph').get();
    if (graphSnap.empty) {
      // Seed initial curriculum graph
      const batch = db.batch();
      for (const [id, node] of Object.entries(CURRICULUM_GRAPH)) {
        batch.set(db.collection('curriculum_graph').doc(id), cleanData(node));
      }
      await batch.commit();
      console.log('[CurriculumStore] Seeded initial curriculum graph to Firestore.');
    } else {
      const loadedGraph: Record<string, CurriculumNode> = {};
      graphSnap.forEach(doc => {
        loadedGraph[doc.id] = doc.data() as CurriculumNode;
      });
      CURRICULUM_GRAPH = loadedGraph;
      console.log(`[CurriculumStore] Loaded ${Object.keys(loadedGraph).length} curriculum nodes from Firestore.`);
    }
  } catch (err) {
    console.error('[CurriculumStore] Error initializing from Firestore, using memory values.', err);
  }
}

// Fire off background synchronization
initFromFirestore();

export function getLearningObject(id: string): LearningObject | undefined {
  return LEARNING_OBJECTS[id];
}

export function getNextObject(currentId: string, outcome: 'onSuccess' | 'onFailure' | 'onStruggle'): string | undefined {
  return CURRICULUM_GRAPH[currentId]?.next[outcome];
}
