const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(`                      competencies={competencies}
                      lang={lang}`, `                      competencies={competencies}
                      events={events}
                      lang={lang}`);

fs.writeFileSync('src/App.tsx', code);
