const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const sseCode = `
  // SSE connection store
  const clients = new Map<string, Set<express.Response>>();

  dispatcher.subscribe('*', async (event) => {
    // Determine which classroom this event belongs to.
    // For demo purposes, we will broadcast to 'demo-class-1'
    const classId = 'demo-class-1'; 
    const classClients = clients.get(classId);
    if (classClients) {
      const data = JSON.stringify(event);
      classClients.forEach(res => {
        try {
          res.write(\`data: \${data}\\n\\n\`);
        } catch (e) {
          console.error('SSE write error', e);
        }
      });
    }
  });

  app.get('/api/v1/classrooms/:classId/stream', requireTeacher, (req, res) => {
    const classId = req.params.classId;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    if (!clients.has(classId)) {
      clients.set(classId, new Set());
    }
    clients.get(classId)!.add(res);

    req.on('close', () => {
      clients.get(classId)?.delete(res);
      if (clients.get(classId)?.size === 0) {
        clients.delete(classId);
      }
    });
  });
`;

code = code.replace("  // --- API Routes ---", sseCode + "\n  // --- API Routes ---");

fs.writeFileSync('server.ts', code);
