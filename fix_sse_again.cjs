const fs = require('fs');
let code = fs.readFileSync('src/components/ClassroomCockpit.tsx', 'utf-8');

const sseReplace = `    fetchData();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      const url = \`/api/v1/classrooms/demo-class-1/stream\${token ? '?token=' + token : ''}\`;
      eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const parsedEvent = JSON.parse(event.data);
          const latency = Date.now() - new Date(parsedEvent.timestamp).getTime();
          console.log(\`[SSE] Event \${parsedEvent.eventType} received with \${latency}ms latency\`);
          
          window.dispatchEvent(new CustomEvent('class-latency', { detail: latency }));
          
          if (parsedEvent.eventType === 'COMMAND.INTERVENTION.FORCED_PAUSE' || parsedEvent.eventType.includes('INTERVENTION')) {
            window.dispatchEvent(new CustomEvent('teacher-alert', { detail: parsedEvent }));
          }

          fetchData();
        } catch (e) {
          console.error('SSE parse error', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error, reconnecting...', error);
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimeout);
    };
  }, [token]);`;

// Use regex to replace everything from `const interval = setInterval(fetchData, 1000);` to `}, []);`
code = code.replace(/const interval = setInterval\(fetchData, 1000\);[\s\S]*?\}, \[\]\);/m, sseReplace);

fs.writeFileSync('src/components/ClassroomCockpit.tsx', code);
