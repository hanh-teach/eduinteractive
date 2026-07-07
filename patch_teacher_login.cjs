const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherLogin.tsx', 'utf-8');

const searchStr = `        await createUserWithEmailAndPassword(auth, email, password);`;
const replaceStr = `        const res = await fetch('/api/v1/teacher/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to register');
        }
        await signInWithEmailAndPassword(auth, email, password);`;

code = code.replace(searchStr, replaceStr);

fs.writeFileSync('src/components/TeacherLogin.tsx', code);
