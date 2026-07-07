const fs = require('fs');
let code = fs.readFileSync('src/components/ClassroomCockpit.tsx', 'utf-8');

const searchStr = `    // Optimize: Speed up polling frequency to 1000ms instead of 3000ms for near-instantaneous cockpit synchronization
    const interval = setInterval(fetchData, 1000);
    fetchData();

    return () => clearInterval(interval);
  }, []);`;

const replaceStr = `    fetchData();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      // Need token for SSE? EventSource doesn't support headers easily natively unless we use a polyfill or send token in URL
      // Since it's a demo, we can append token to query string
      const url = \`/api/v1/classrooms/demo-class-1/stream\${token ? '?token=' + token : ''}\`;
      eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const parsedEvent = JSON.parse(event.data);
          
          // Calculate latency
          const latency = Date.now() - new Date(parsedEvent.timestamp).getTime();
          console.log(\`[SSE] Event \${parsedEvent.eventType} received with \${latency}ms latency\`);
          
          // Update latency state if it exists, for now we will dispatch a custom event
          window.dispatchEvent(new CustomEvent('class-latency', { detail: latency }));
          
          // Alert intervention
          if (parsedEvent.eventType === 'COMMAND.INTERVENTION.FORCED_PAUSE' || parsedEvent.eventType.includes('INTERVENTION')) {
            window.dispatchEvent(new CustomEvent('teacher-alert', { detail: parsedEvent }));
          }

          // Trigger a re-fetch to get the latest state smoothly
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

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('src/components/ClassroomCockpit.tsx', code);
