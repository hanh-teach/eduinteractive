const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const searchStr = `  // Query API: Get Session Events
  app.get('/api/v1/sessions/:sessionId/events', async (req, res) => {
    try {
      const events = await getSessionEvents(req.params.sessionId);`;
const replaceStr = `  // Query API: Get Session Events
  app.get('/api/v1/sessions/:sessionId/events', async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.role === 'student') {
        const state = await getSessionState(req.params.sessionId);
        if (state && state.studentId !== user.uid) {
          return res.status(403).json({ error: 'Forbidden: Cannot access other student session' });
        }
      }
      const events = await getSessionEvents(req.params.sessionId);`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('server.ts', code);
