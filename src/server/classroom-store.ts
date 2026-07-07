import { ClassroomState, StudentSnapshot } from '../types.js';
import { db, isFirestoreFallback, cleanData } from './firebase.js';

const memoryClassrooms: Record<string, ClassroomState> = {
  'demo-class-1': {
    classId: 'demo-class-1',
    activeStudents: {},
    aggregates: {
      averageAccuracy: 0,
      stugglingCount: 0,
      completionRate: 0
    }
  }
};

export async function getClassroomState(classId: string): Promise<ClassroomState> {
  if (isFirestoreFallback || !db) {
    return memoryClassrooms[classId] || {
      classId,
      activeStudents: {},
      aggregates: { averageAccuracy: 0, stugglingCount: 0, completionRate: 0 }
    };
  }

  try {
    const docSnap = await db.collection('classrooms').doc(classId).get();
    if (docSnap.exists) {
      return docSnap.data() as ClassroomState;
    }
    // Return default state
    const defaultState: ClassroomState = {
      classId,
      activeStudents: {},
      aggregates: { averageAccuracy: 0, stugglingCount: 0, completionRate: 0 }
    };
    if (classId === 'demo-class-1') {
      await db.collection('classrooms').doc(classId).set(cleanData(defaultState));
    }
    return defaultState;
  } catch (err) {
    console.error(`[ClassroomStore] Failed to get classroom ${classId} from Firestore. Falling back to memory.`, err);
    return memoryClassrooms[classId] || {
      classId,
      activeStudents: {},
      aggregates: { averageAccuracy: 0, stugglingCount: 0, completionRate: 0 }
    };
  }
}

export async function updateStudentSnapshot(classId: string, snapshot: StudentSnapshot): Promise<void> {
  if (isFirestoreFallback || !db) {
    if (!memoryClassrooms[classId]) {
      memoryClassrooms[classId] = {
        classId,
        activeStudents: {},
        aggregates: { averageAccuracy: 0, stugglingCount: 0, completionRate: 0 }
      };
    }
    
    memoryClassrooms[classId].activeStudents[snapshot.studentId] = snapshot;
    
    // Recalculate aggregates
    const students = Object.values(memoryClassrooms[classId].activeStudents);
    const totalAccuracy = students.reduce((acc, s) => {
      const avg = s.competencies.reduce((cAcc, c) => cAcc + c.masteryVector.accuracy, 0) / (s.competencies.length || 1);
      return acc + avg;
    }, 0);
    
    memoryClassrooms[classId].aggregates.averageAccuracy = totalAccuracy / (students.length || 1);
    memoryClassrooms[classId].aggregates.stugglingCount = students.filter(s => 
      s.competencies.some(c => c.masteryVector.accuracy < 0.4)
    ).length;
    return;
  }

  try {
    const docRef = db.collection('classrooms').doc(classId);
    const docSnap = await docRef.get();
    let currentClassroom: ClassroomState;
    
    if (docSnap.exists) {
      currentClassroom = docSnap.data() as ClassroomState;
    } else {
      currentClassroom = {
        classId,
        activeStudents: {},
        aggregates: { averageAccuracy: 0, stugglingCount: 0, completionRate: 0 }
      };
    }

    if (!currentClassroom.activeStudents) {
      currentClassroom.activeStudents = {};
    }

    currentClassroom.activeStudents[snapshot.studentId] = snapshot;

    // Recalculate aggregates
    const students = Object.values(currentClassroom.activeStudents);
    const totalAccuracy = students.reduce((acc, s) => {
      const avg = s.competencies.reduce((cAcc, c) => cAcc + c.masteryVector.accuracy, 0) / (s.competencies.length || 1);
      return acc + avg;
    }, 0);
    
    currentClassroom.aggregates.averageAccuracy = totalAccuracy / (students.length || 1);
    currentClassroom.aggregates.stugglingCount = students.filter(s => 
      s.competencies.some(c => c.masteryVector.accuracy < 0.4)
    ).length;

    await docRef.set(cleanData(currentClassroom));
  } catch (err) {
    console.error(`[ClassroomStore] Failed to update student snapshot for classroom ${classId} in Firestore. Falling back to memory.`, err);
    
    if (!memoryClassrooms[classId]) {
      memoryClassrooms[classId] = {
        classId,
        activeStudents: {},
        aggregates: { averageAccuracy: 0, stugglingCount: 0, completionRate: 0 }
      };
    }
    
    memoryClassrooms[classId].activeStudents[snapshot.studentId] = snapshot;
    
    // Recalculate aggregates
    const students = Object.values(memoryClassrooms[classId].activeStudents);
    const totalAccuracy = students.reduce((acc, s) => {
      const avg = s.competencies.reduce((cAcc, c) => cAcc + c.masteryVector.accuracy, 0) / (s.competencies.length || 1);
      return acc + avg;
    }, 0);
    
    memoryClassrooms[classId].aggregates.averageAccuracy = totalAccuracy / (students.length || 1);
    memoryClassrooms[classId].aggregates.stugglingCount = students.filter(s => 
      s.competencies.some(c => c.masteryVector.accuracy < 0.4)
    ).length;
  }
}
