const fs = require('fs');
let code = fs.readFileSync('src/server/curriculum-store.ts', 'utf-8');
code = code.replace("InteractionType.SUMMARY || 'SUMMARY'", "InteractionType.SUMMARY");
fs.writeFileSync('src/server/curriculum-store.ts', code);
