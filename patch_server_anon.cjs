const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newRoute = `
  app.post('/api/v1/student/register-anonymous', express.json(), async (req, res) => {
    try {
      const uid = \`student_\${Math.random().toString(36).substring(2, 15)}\`;
      // We don't necessarily need to create the user in Identity Platform if we just use custom tokens, 
      // but to be safe we can just create the custom token. 
      // Wait, if the user doesn't exist, signing in with custom token might automatically create it?
      // Yes, sign in with custom token creates the user record if it doesn't exist.
      const customToken = await getAuth().createCustomToken(uid);
      res.json({ token: customToken });
    } catch (error: any) {
      console.error('Anonymous registration error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/v1/teacher/register'`;

code = code.replace("  app.post('/api/v1/teacher/register'", newRoute);
fs.writeFileSync('server.ts', code);
