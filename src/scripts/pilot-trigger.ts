// No need to import fetch, using global fetch
const BASE_URL = 'http://localhost:3000';

async function ingestEvent(sessionId: string, type: string, payload: any) {
  const response = await fetch(`${BASE_URL}/api/v1/events/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, type, payload, actorId: 'STUDENT' }),
  });
  if (!response.ok) throw new Error(`Failed to ingest event ${type}: ${response.statusText}`);
  return response.json();
}

async function createSession(studentId: string, lessonId: string) {
  const response = await fetch(`${BASE_URL}/api/v1/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, lessonId }),
  });
  if (!response.ok) throw new Error('Failed to create session');
  return response.json();
}

async function runStandardFlow() {
  console.log('--- Running Standard Flow ---');
  const session = await createSession('student-std-001', 'python-if-intro');
  const sessionId = session.sessionId;
  console.log(`Session Created: ${sessionId}`);

  await ingestEvent(sessionId, 'VIEW_CONTENT', { objectId: 'intro-video' });
  await ingestEvent(sessionId, 'SUBMIT_QUIZ', { objectId: 'quiz-1', result: 'CORRECT' });
  await ingestEvent(sessionId, 'SESSION_ENDED', { status: 'COMPLETED' });
  console.log('Standard Flow Completed.');
}

async function runErroneousFlow() {
  console.log('--- Running Erroneous Flow ---');
  const session = await createSession('student-err-001', 'python-if-intro');
  const sessionId = session.sessionId;
  console.log(`Session Created: ${sessionId}`);

  await ingestEvent(sessionId, 'VIEW_CONTENT', { objectId: 'intro-video' });
  await ingestEvent(sessionId, 'SUBMIT_QUIZ', { objectId: 'quiz-1', result: 'INCORRECT' });
  await ingestEvent(sessionId, 'RETRY_QUIZ', { objectId: 'quiz-1' });
  await ingestEvent(sessionId, 'SUBMIT_QUIZ', { objectId: 'quiz-1', result: 'CORRECT' });
  await ingestEvent(sessionId, 'SESSION_ENDED', { status: 'COMPLETED' });
  console.log('Erroneous Flow Completed.');
}

(async () => {
  try {
    await runStandardFlow();
    await runErroneousFlow();
    console.log('All pilot traces recorded successfully.');
  } catch (err) {
    console.error('Pilot trigger failed:', err);
  }
})();
