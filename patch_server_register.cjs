const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newRoute = `
  app.post('/api/v1/teacher/register', express.json(), async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      
      const userRecord = await getAuth().createUser({
        email,
        password,
      });
      
      res.json({ success: true, uid: userRecord.uid });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/health'`;

code = code.replace("  app.get('/api/health'", newRoute);
fs.writeFileSync('server.ts', code);
