const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const searchStr = `const { studentId, lessonId } = req.body;`;
const replaceStr = `let { studentId, lessonId } = req.body;
      const user = (req as any).user;
      if (user.role === 'student') {
        studentId = user.uid; // Enforce own uid
      }`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('server.ts', code);
