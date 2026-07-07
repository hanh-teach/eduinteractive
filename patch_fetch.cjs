const fs = require('fs');
let code = fs.readFileSync('src/components/ClassroomCockpit.tsx', 'utf-8');

// Insert authFetch at the top of the component
const authFetchDef = `
  const authFetch = (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', \`Bearer \${token}\`);
    return fetch(url, { ...options, headers });
  };
`;

code = code.replace(/export function ClassroomCockpit\([^)]*\) \{/, (match) => {
  return match + authFetchDef;
});

// Replace all fetch(...) calls inside the component with authFetch(...)
// Exclude the word "safeFetchJson" if it contains fetch, but here it's isolated.
code = code.replace(/await fetch\(/g, 'await authFetch(');

fs.writeFileSync('src/components/ClassroomCockpit.tsx', code);
