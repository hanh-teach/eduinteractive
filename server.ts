import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { v4 as uuidv4 } from 'uuid';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const firebaseAppConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const JWT_SECRET = process.env.JWT_SECRET || firebaseAppConfig.apiKey || 'edu-os-secret-key';
const firebaseConfig = firebaseAppConfig;

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      projectId: firebaseAppConfig.projectId
    });
  } catch (e) {
    console.log('Firebase Admin init error:', e);
  }
}
const db = getFirestore();

import { dispatcher } from './src/server/dispatcher.js';
import { getSessionEvents } from './src/server/event-store.js';
import { getSessionState } from './src/server/session-store.js';
import { getStudentCompetencies } from './src/server/competency-store.js';
import { runtimeEngine } from './src/server/runtime-engine.js';
import { evidenceEngine } from './src/server/evidence-engine.js';
import { competencyEngine } from './src/server/competency-engine.js';
import { advisoryEngine } from './src/server/advisory-engine.js';
import { classroomEngine } from './src/server/classroom-engine.js';
import { policyEngine } from './src/server/policy-engine.js';
import { optimizationEngine } from './src/server/optimization-engine.js';
import { curriculumEvolutionEngine } from './src/server/curriculum-evolution-engine.js';
import { curriculumVersionStore } from './src/server/curriculum-version-store.js';
import { monitoringEngine } from './src/server/monitoring-engine.js';
import { stressTestEngine } from './src/server/stress-test-engine.js';
import { pilotManager } from './src/server/pilot-manager.js';
import { pilotMetricEngine } from './src/server/pilot-metric-engine.js';
import { pilotReadinessEngine } from './src/server/pilot-readiness-engine.js';
import { pilotValidationEngine } from './src/server/pilot-validation-engine.js';
import { controlledExposureEngine } from './src/server/controlled-exposure-engine.js';
import { behavioralStressTestEngine } from './src/server/behavioral-stress-engine.js';
import { getClassroomState } from './src/server/classroom-store.js';
import { EventClass, SessionState, AuthorityLevel } from './src/types.js';

// Initialize the engines to start listening
const engine = runtimeEngine;
const evEngine = evidenceEngine;
const cpEngine = competencyEngine;
const adEngine = advisoryEngine;
const clEngine = classroomEngine;
const plEngine = policyEngine;
const opEngine = optimizationEngine;
const ceEngine = curriculumEvolutionEngine;
const cvStore = curriculumVersionStore;
const moEngine = monitoringEngine;
const stEngine = stressTestEngine;
const piManager = pilotManager;
const prEngine = pilotReadinessEngine;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Middleware for Correlation IDs ---
  app.use((req, res, next) => {
    const correlationId = req.header('x-correlation-id') || req.header('X-Correlation-Id') || `corr-${uuidv4()}`;
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
  });

  // --- Registration & Auth Routes (Public) ---
  app.post('/api/v1/student/register-anonymous', express.json(), async (req, res) => {
    try {
      const uid = `student_${Math.random().toString(36).substring(2, 15)}`;
      const token = jwt.sign({ uid, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, uid });
    } catch (error: any) {
      console.error('Anonymous registration error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/v1/teacher/register', express.json(), async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Check if teacher already exists
      const teacherRef = db.collection('teachers').doc(email.toLowerCase());
      const doc = await teacherRef.get();
      if (doc.exists) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password and store in Firestore
      const passwordHash = await bcrypt.hash(password, 10);
      await teacherRef.set({
        email: email.toLowerCase(),
        passwordHash,
        createdAt: Timestamp.now()
      });

      const uid = email.toLowerCase();
      const token = jwt.sign({ uid, email: email.toLowerCase(), role: 'teacher' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ success: true, token, uid });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/v1/teacher/login', express.json(), async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Fetch teacher record
      const teacherRef = db.collection('teachers').doc(email.toLowerCase());
      const doc = await teacherRef.get();
      if (!doc.exists) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const teacherData = doc.data();
      const isValid = await bcrypt.compare(password, teacherData?.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const uid = email.toLowerCase();
      const token = jwt.sign({ uid, email: email.toLowerCase(), role: 'teacher' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ success: true, token, uid });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Auth Middleware ---
  const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Skip auth for health and some pilot routes if needed, but the prompt says:
    // "Thêm middleware ở server.ts xác thực Firebase ID token gửi kèm mỗi request... trả về 401 nếu thiếu/invalid token."
    // Let's protect all /api routes except /api/health maybe?
    if (req.path === '/api/health') return next();

    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
    } else if (req.query.token) {
      token = req.query.token as string;
    } else {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      next();
    } catch (err) {
      // Fallback: try Firebase verifyIdToken if it was a real Firebase token
      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        (req as any).user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: decodedToken.firebase.sign_in_provider === 'anonymous' ? 'student' : 'teacher'
        };
        next();
      } catch (fErr) {
        console.error('Auth verification failed:', err, fErr);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }
    }
  };

  const requireTeacher = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if ((req as any).user?.role !== 'teacher') {
      return res.status(403).json({ error: 'Forbidden: Requires teacher role' });
    }
    next();
  };

  // Protect all /api/v1 routes
  app.use('/api/v1', authMiddleware);


  // SSE connection store
  const clients = new Map<string, Set<express.Response>>();

  dispatcher.subscribe('*', async (event) => {
    // Determine which classroom this event belongs to.
    // For demo purposes, we will broadcast to 'demo-class-1'
    const classId = 'demo-class-1'; 
    const classClients = clients.get(classId);
    if (classClients) {
      const data = JSON.stringify(event);
      classClients.forEach(res => {
        try {
          res.write(`data: ${data}\n\n`);
        } catch (e) {
          console.error('SSE write error', e);
        }
      });
    }
  });

  app.get('/api/v1/classrooms/:classId/stream', requireTeacher, (req, res) => {
    const classId = req.params.classId;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    if (!clients.has(classId)) {
      clients.set(classId, new Set());
    }
    clients.get(classId)!.add(res);

    req.on('close', () => {
      clients.get(classId)?.delete(res);
      if (clients.get(classId)?.size === 0) {
        clients.delete(classId);
      }
    });
  });

  // --- API Routes ---

  // Session API: Initialize
  app.post('/api/v1/sessions', async (req, res, next) => {
    try {
      let { studentId, lessonId } = req.body;
      const user = (req as any).user;
      if (user.role === 'student') {
        studentId = user.uid; // Enforce own uid
      }
      const sessionId = uuidv4();
      const correlationId = req.headers['x-correlation-id'] as string;
      
      const initialEvent = {
        eventId: uuidv4(),
        eventType: 'SESSION.STARTED',
        version: '1.0.0',
        sessionId,
        timestamp: new Date().toISOString(),
        actorId: 'SYSTEM',
        payload: { studentId, lessonId },
        metadata: {
          traceId: correlationId || uuidv4(),
          source: 'RuntimeService',
          class: EventClass.SYSTEM
        }
      };

      await dispatcher.dispatch(initialEvent);
      
      res.json({ sessionId, state: SessionState.READY, correlationId });
    } catch (err) {
      next(err);
    }
  });

  // Event API: Ingest
  app.post('/api/v1/events/ingest', async (req, res, next) => {
    try {
      const { sessionId, type, payload, actorId, origin } = req.body;
      const user = (req as any).user;
      
      if (user.role === 'student') {
        const state = await getSessionState(sessionId);
        if (state && state.studentId !== user.uid) {
          return res.status(403).json({ error: 'Forbidden: Cannot write to other student session' });
        }
      }
      const correlationId = req.headers['x-correlation-id'] as string;
      
      const event = {
        eventId: uuidv4(),
        eventType: type,
        version: '1.0.0',
        sessionId,
        timestamp: new Date().toISOString(),
        actorId: actorId || 'STUDENT',
        payload,
        metadata: {
          traceId: correlationId || uuidv4(),
          source: 'IngestionGateway',
          class: type.startsWith('SYS.') ? EventClass.SYSTEM : EventClass.ADVISORY,
          origin: origin || 'synthetic'
        }
      };

      await dispatcher.dispatch(event);
      res.status(202).json({ eventId: event.eventId, correlationId });
    } catch (err) {
      next(err);
    }
  });

  // Query API: Get Session Events
  app.get('/api/v1/sessions/:sessionId/events', async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role === 'student') {
        const state = await getSessionState(req.params.sessionId);
        if (state && state.studentId !== user.uid) {
          return res.status(403).json({ error: 'Forbidden: Cannot access other student session' });
        }
      }
      const events = await getSessionEvents(req.params.sessionId);
      res.json({ events });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Query API: Get Session State
  app.get('/api/v1/sessions/:sessionId/state', async (req, res) => {
    try {
      const user = (req as any).user;
      const corrId = req.headers['x-correlation-id'] as string;
      const clientGen = req.headers['x-session-generation'] ? parseInt(req.headers['x-session-generation'] as string, 10) : undefined;
      const state = await getSessionState(req.params.sessionId, corrId, clientGen);
      if (!state) return res.status(404).json({ error: 'Session not found' });
      
      // Route authorization: students only read/write their own session
      if (user.role === 'student' && state.studentId !== user.uid) {
        return res.status(403).json({ error: 'Forbidden: Cannot access other student session' });
      }

      res.json(state);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch session state' });
    }
  });

  // Query API: Get Student Competencies
  app.get('/api/v1/students/:studentId/competencies', async (req, res) => {
    try {
      const competencies = await getStudentCompetencies(req.params.studentId);
      res.json({ competencies });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch competencies' });
    }
  });

  // Query API: Get Classroom State
  app.get('/api/v1/classrooms/:classId', async (req, res) => {
    try {
      const state = await getClassroomState(req.params.classId);
      res.json(state);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch classroom state' });
    }
  });

  // Policy API: Interventions
  app.get('/api/v1/interventions', requireTeacher, async (req, res) => {
    res.json({ interventions: policyEngine.getAllInterventions() });
  });

  // Optimization API: Metrics
  app.get('/api/v1/optimization/metrics', async (req, res) => {
    res.json(optimizationEngine.getMetrics());
  });

  // Curriculum Evolution API
  app.get('/api/v1/curriculum/evolution/propose', async (req, res) => {
    try {
      const proposal = await curriculumEvolutionEngine.proposeEvolution();
      res.json(proposal);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate evolution proposal' });
    }
  });

  app.get('/api/v1/curriculum/versions', async (req, res) => {
    res.json({ versions: curriculumVersionStore.getAllVersions() });
  });

  app.post('/api/v1/curriculum/versions/activate', express.json(), async (req, res) => {
    const { versionId } = req.body;
    curriculumVersionStore.activateVersion(versionId);
    res.json({ success: true, activeVersion: curriculumVersionStore.getActiveVersion() });
  });
  
  // Monitoring API: System Health & Learning SLOs
  app.get('/api/v1/system/health', async (req, res) => {
    res.json(monitoringEngine.getHealthReport());
  });

  // Pilot Deployment API
  app.use('/api/v1/pilot', requireTeacher);

  app.post('/api/v1/pilot/sessions', express.json(), async (req, res) => {
    const session = pilotManager.startSession(req.body.classId);
    res.json(session);
  });

  app.post('/api/v1/pilot/observations', express.json(), async (req, res) => {
    const observation = pilotManager.addObservation(req.body.sessionId, req.body);
    res.json(observation);
  });

  app.get('/api/v1/pilot/sessions/:id/logs', async (req, res) => {
    res.json(pilotManager.getLogs(req.params.id));
  });

  app.get('/api/v1/pilot/sessions/:id/metrics', async (req, res) => {
    res.json(pilotMetricEngine.getMetrics(req.params.id));
  });

  // Pilot Readiness & RDI API
  app.get('/api/v1/pilot/contract', async (req, res) => {
    let contract = pilotReadinessEngine.getContract();
    if (!contract) {
      contract = pilotReadinessEngine.initializeContract();
    }
    res.json(contract);
  });

  app.get('/api/v1/pilot/sessions/:id/rdi', async (req, res) => {
    const metrics = pilotMetricEngine.getMetrics(req.params.id);
    const rdi = pilotReadinessEngine.calculateRDI(req.params.id, metrics);
    res.json(rdi);
  });

  // Pilot Validation API
  app.get('/api/v1/pilot/validation/protocol', async (req, res) => {
    res.json(pilotValidationEngine.getProtocol());
  });

  app.get('/api/v1/pilot/sessions/:id/gtci', async (req, res) => {
    const metrics = pilotMetricEngine.getMetrics(req.params.id);
    const gtci = pilotValidationEngine.calculateGtci(req.params.id, metrics);
    res.json(gtci);
  });

  app.post('/api/v1/pilot/sessions/:id/validation/scores', express.json(), async (req, res) => {
    try {
      pilotValidationEngine.submitExternalScore({
        ...req.body,
        sessionId: req.params.id
      });
      res.json({ status: 'success' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to submit score' });
    }
  });

  app.get('/api/v1/pilot/exposure-protocol', async (req, res) => {
    res.json(controlledExposureEngine.getProtocol());
  });

  app.get('/api/v1/pilot/behavioral-stress-protocol', async (req, res) => {
    res.json(behavioralStressTestEngine.getProtocol());
  });

  // Stress Test API
  app.post('/api/v1/system/stress-test', express.json(), async (req, res) => {
    try {
      const result = await stEngine.runScenario(req.body);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Stress test failed' });
    }
  });

  app.post('/api/v1/interventions', express.json(), requireTeacher, async (req, res) => {
    try {
      const intervention = await policyEngine.requestIntervention(req.body);
      
      // If approved, dispatch a command event
      if (intervention.status === 'APPROVED') {
        await dispatcher.dispatch({
          eventId: uuidv4(),
          eventType: `COMMAND.INTERVENTION.${intervention.action}`,
          version: '1.0.0',
          sessionId: intervention.sessionId,
          timestamp: new Date().toISOString(),
          actorId: 'PolicyEngine',
          payload: intervention.payload,
          metadata: {
            traceId: uuidv4(),
            source: 'PolicyEngine',
            class: EventClass.SYSTEM
          }
        });
      }
      
      res.json(intervention);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to process intervention' });
    }
  });

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', system: 'EduInteractive OS' });
  });

  // Global API error handler
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error captured:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduInteractive OS running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
