const fs = require('fs');
let code = fs.readFileSync('src/components/ClassroomCockpit.tsx', 'utf-8');

const searchStr = `  const [simulating, setSimulating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [recording, setRecording] = useState(false);`;

const replaceStr = `  const [simulating, setSimulating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const handleLatency = (e: any) => setLatency(e.detail);
    const handleAlert = (e: any) => setAlerts(prev => [...prev, e.detail].slice(-3)); // keep last 3

    window.addEventListener('class-latency', handleLatency);
    window.addEventListener('teacher-alert', handleAlert);
    return () => {
      window.removeEventListener('class-latency', handleLatency);
      window.removeEventListener('teacher-alert', handleAlert);
    };
  }, []);
`;

code = code.replace(searchStr, replaceStr);

// Find a good place to show latency and alerts
// I can add latency next to the title or system vitals

const vitalSearch = `<div className="flex items-center gap-3 mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{t.uptime}</span>
          </div>`;

const vitalReplace = `<div className="flex items-center gap-3 mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{t.uptime}</span>
          </div>
          {latency !== null && (
            <div className="text-[10px] font-mono mt-1 flex items-center justify-between">
              <span className="text-slate-500">Live Trace Latency:</span>
              <span className={latency < 500 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{latency}ms</span>
            </div>
          )}`;

code = code.replace(vitalSearch, vitalReplace);

// Let's add the alert banner on top of the grid if there are alerts
const bannerSearch = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">`;
const bannerReplace = `
      {alerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {alerts.map((alert, i) => (
            <div key={i} className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Action Required: Intervention Triggered</p>
                <p className="text-xs opacity-90">{alert.eventType} for session {alert.sessionId}</p>
              </div>
              <button onClick={() => setAlerts(prev => prev.filter((_, idx) => idx !== i))} className="ml-auto p-1 hover:bg-red-500/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">`;

code = code.replace(bannerSearch, bannerReplace);

fs.writeFileSync('src/components/ClassroomCockpit.tsx', code);
