const fs = require('fs');
let code = fs.readFileSync('src/components/StudentLesson.tsx', 'utf-8');
code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/StudentLesson.tsx', code);
