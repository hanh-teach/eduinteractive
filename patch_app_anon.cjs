const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const importSearch = "import { signInAnonymously, onAuthStateChanged, User, getIdToken } from 'firebase/auth';";
const importReplace = "import { signInWithCustomToken, signInAnonymously, onAuthStateChanged, User, getIdToken } from 'firebase/auth';";
code = code.replace(importSearch, importReplace);

const signinSearch = `  useEffect(() => {
    if (viewMode === 'student' && !user) {
      signInAnonymously(auth).catch(console.error);
    }
  }, [viewMode, user]);`;

const signinReplace = `  useEffect(() => {
    if (viewMode === 'student' && !user) {
      const loginAnon = async () => {
        try {
          const res = await fetch('/api/v1/student/register-anonymous', { method: 'POST' });
          const data = await res.json();
          if (data.token) {
            await signInWithCustomToken(auth, data.token);
          } else {
            // fallback if endpoint fails or missing
            await signInAnonymously(auth);
          }
        } catch (err) {
          console.error(err);
          // ultimate fallback
          signInAnonymously(auth).catch(console.error);
        }
      };
      loginAnon();
    }
  }, [viewMode, user]);`;

code = code.replace(signinSearch, signinReplace);
fs.writeFileSync('src/App.tsx', code);
