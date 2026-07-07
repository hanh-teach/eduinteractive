const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const searchStr = `const { sessionId, type, payload, actorId, origin } = req.body;`;
const replaceStr = `const { sessionId, type, payload, actorId, origin } = req.body;
      const user = (req as any).user;
      
      if (user.role === 'student') {
        const state = await getSessionState(sessionId);
        if (state && state.studentId !== user.uid) {
          return res.status(403).json({ error: 'Forbidden: Cannot write to other student session' });
        }
      }`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('server.ts', code);
