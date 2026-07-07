const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const searchStr = `    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split('Bearer ')[1];`;

const replaceStr = `    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
    } else if (req.query.token) {
      token = req.query.token as string;
    } else {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('server.ts', code);
