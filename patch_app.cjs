const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Add import
const importStatement = "import { TeacherLogin } from './components/TeacherLogin';\n";
code = code.replace(/import { ClassroomCockpit }/, importStatement + 'import { ClassroomCockpit }');

// Find the teacher view part
const searchStr = `<ClassroomCockpit lang={lang} theme={theme} token={token} />`;
const replaceStr = `(user && user.email) ? (
            <ClassroomCockpit lang={lang} theme={theme} token={token} />
          ) : (
            <TeacherLogin lang={lang} />
          )`;

code = code.replace(searchStr, replaceStr);

fs.writeFileSync('src/App.tsx', code);
