import { CurriculumVersion } from '../types.js';
import { CURRICULUM_GRAPH, LEARNING_OBJECTS } from './curriculum-store.js';
import { v4 as uuidv4 } from 'uuid';
import { db, isFirestoreFallback, cleanData } from './firebase.js';

class CurriculumVersionStore {
  private versions: CurriculumVersion[] = [];
  private activeVersionId: string = 'v1-initial';

  constructor() {
    // Seed with initial version in memory first
    const initial: CurriculumVersion = {
      versionId: 'v1-initial',
      timestamp: new Date().toISOString(),
      author: 'SYSTEM',
      graph: CURRICULUM_GRAPH,
      objects: LEARNING_OBJECTS,
      status: 'ACTIVE'
    };
    this.versions.push(initial);

    // Load/Seed from Firestore in background
    this.initFromFirestore();
  }

  private async initFromFirestore() {
    if (isFirestoreFallback || !db) return;

    try {
      const snapshot = await db.collection('curriculum_versions').get();
      if (snapshot.empty) {
        // Seed first version into Firestore
        await db.collection('curriculum_versions').doc('v1-initial').set(cleanData(this.versions[0]));
        console.log('[CurriculumVersionStore] Seeded initial curriculum version to Firestore.');
      } else {
        const loaded: CurriculumVersion[] = [];
        let activeId = 'v1-initial';
        snapshot.forEach(doc => {
          const v = doc.data() as CurriculumVersion;
          loaded.push(v);
          if (v.status === 'ACTIVE') {
            activeId = v.versionId;
          }
        });
        this.versions = loaded;
        this.activeVersionId = activeId;
        console.log(`[CurriculumVersionStore] Loaded ${loaded.length} curriculum versions from Firestore. Active: ${activeId}`);
      }
    } catch (error) {
      console.error('[CurriculumVersionStore] Failed to load from Firestore, using memory values.', error);
    }
  }

  public getActiveVersion(): CurriculumVersion {
    return this.versions.find(v => v.versionId === this.activeVersionId) || this.versions[0];
  }

  public getAllVersions(): CurriculumVersion[] {
    return this.versions;
  }

  public createNewVersion(author: string, graph: any, objects: any): CurriculumVersion {
    const newVersion: CurriculumVersion = {
      versionId: `v-${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      author,
      graph,
      objects,
      status: 'STAGED'
    };
    this.versions.push(newVersion);

    // Save to Firestore asynchronously
    if (!isFirestoreFallback && db) {
      db.collection('curriculum_versions').doc(newVersion.versionId).set(cleanData(newVersion))
        .then(() => console.log(`[CurriculumVersionStore] Saved new version ${newVersion.versionId} to Firestore.`))
        .catch(err => console.error('[CurriculumVersionStore] Failed to save curriculum version to Firestore:', err));
    }

    return newVersion;
  }

  public activateVersion(versionId: string): void {
    const version = this.versions.find(v => v.versionId === versionId);
    if (!version) return;

    // Archive old active version
    const oldActive = this.versions.find(v => v.status === 'ACTIVE');
    if (oldActive) {
      oldActive.status = 'ARCHIVED';
      if (!isFirestoreFallback && db) {
        db.collection('curriculum_versions').doc(oldActive.versionId).update({ status: 'ARCHIVED' })
          .catch(err => console.error('[CurriculumVersionStore] Failed to archive old version in Firestore:', err));
      }
    }

    version.status = 'ACTIVE';
    this.activeVersionId = versionId;

    if (!isFirestoreFallback && db) {
      db.collection('curriculum_versions').doc(versionId).update({ status: 'ACTIVE' })
        .then(() => console.log(`[CurriculumVersionStore] Activated curriculum version ${versionId} in Firestore.`))
        .catch(err => console.error('[CurriculumVersionStore] Failed to activate version in Firestore:', err));
    }
    
    console.log(`[VersionStore] Activated curriculum version: ${versionId}`);
  }
}

export const curriculumVersionStore = new CurriculumVersionStore();
