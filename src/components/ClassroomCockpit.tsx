import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Activity, AlertTriangle, CheckCircle, BarChart3, ShieldAlert, Gavel, Cpu, Zap, Microscope, ShieldCheck, Flame, Rocket, ClipboardList, X } from 'lucide-react';
import { ClassroomState, AuthorityLevel } from '../types';
import { translations } from '../translations';

export function ClassroomCockpit({ lang = 'vi', theme = 'dark', token }: { lang?: 'vi' | 'en'; theme?: 'light' | 'dark' | 'auto'; token?: string | null }) {
  const authFetch = (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...options, headers });
  };

  const t = translations[lang];
  const [classroom, setClassroom] = useState<ClassroomState | null>(null);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  const [pilotSession, setPilotSession] = useState<any>(null);
  const [pilotLogs, setPilotLogs] = useState<any[]>([]);
  const [pilotMetrics, setPilotMetrics] = useState<any>(null);
  const [pilotContract, setPilotContract] = useState<any>(null);
  const [rdi, setRdi] = useState<any>(null);
  const [validationProtocol, setValidationProtocol] = useState<any>(null);
  const [gtci, setGtci] = useState<any>(null);
  const [exposureProtocol, setExposureProtocol] = useState<any>(null);
  const [stressProtocol, setStressProtocol] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
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


  useEffect(() => {
    const safeFetchJson = async (url: string) => {
      const response = await authFetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} on ${url}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid content-type on ${url}: expected application/json, got ${contentType}`);
      }
      return response.json();
    };

    const fetchData = async () => {
      try {
        // Optimize: Execute all 9 API calls in parallel using Promise.allSettled to prevent sequential waterfall bottlenecks and ensure fault tolerance
        const results = await Promise.allSettled([
          safeFetchJson('/api/v1/classrooms/demo-class-1'),
          safeFetchJson('/api/v1/interventions'),
          safeFetchJson('/api/v1/optimization/metrics'),
          safeFetchJson('/api/v1/curriculum/versions'),
          safeFetchJson('/api/v1/system/health'),
          safeFetchJson('/api/v1/pilot/contract'),
          safeFetchJson('/api/v1/pilot/validation/protocol'),
          safeFetchJson('/api/v1/pilot/exposure-protocol'),
          safeFetchJson('/api/v1/pilot/behavioral-stress-protocol')
        ]);

        if (results[0].status === 'fulfilled') setClassroom(results[0].value);
        if (results[1].status === 'fulfilled') setInterventions(results[1].value.interventions || []);
        if (results[2].status === 'fulfilled') setMetrics(results[2].value);
        if (results[3].status === 'fulfilled') setVersions(results[3].value.versions || []);
        if (results[4].status === 'fulfilled') setHealth(results[4].value);
        if (results[5].status === 'fulfilled') setPilotContract(results[5].value);
        if (results[6].status === 'fulfilled') setValidationProtocol(results[6].value);
        if (results[7].status === 'fulfilled') setExposureProtocol(results[7].value);
        if (results[8].status === 'fulfilled') setStressProtocol(results[8].value);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    // Optimize: Speed up polling frequency to 1000ms instead of 3000ms for near-instantaneous cockpit synchronization
        fetchData();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      const url = `/api/v1/classrooms/demo-class-1/stream${token ? '?token=' + token : ''}`;
      eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const parsedEvent = JSON.parse(event.data);
          const latency = Date.now() - new Date(parsedEvent.timestamp).getTime();
          console.log(`[SSE] Event ${parsedEvent.eventType} received with ${latency}ms latency`);
          
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
  }, [token]);

  const generateProposal = async () => {
    setSimulating(true);
    try {
      const res = await authFetch('/api/v1/curriculum/evolution/propose');
      const data = await res.json();
      setProposal(data);
    } catch (err) {
      console.error('Failed to generate proposal:', err);
    } finally {
      setSimulating(false);
    }
  };

  const applyEvolution = async () => {
    if (!proposal) return;
    try {
      // In a real system, this would call a POST to /api/v1/curriculum/evolve
      // For the demo, we'll just simulate the version creation
      const res = await authFetch('/api/v1/curriculum/versions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: proposal.id }) // Simulation
      });
      setProposal(null);
      // Refresh versions
      const verRes = await authFetch('/api/v1/curriculum/versions');
      const verData = await verRes.json();
      setVersions(verData.versions);
    } catch (err) {
      console.error('Failed to apply evolution:', err);
    }
  };

  const activateVersion = async (versionId: string) => {
    try {
      await authFetch('/api/v1/curriculum/versions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId })
      });
      // Refresh versions
      const verRes = await authFetch('/api/v1/curriculum/versions');
      const verData = await verRes.json();
      setVersions(verData.versions);
    } catch (err) {
      console.error('Failed to activate version:', err);
    }
  };

  const runStressTest = async (type: string) => {
    setTesting(true);
    try {
      const res = await authFetch('/api/v1/system/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `test-${Date.now()}`,
          name: `Pedagogical Stress: ${type}`,
          type,
          intensity: 0.8
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error('Stress test failed:', err);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (pilotSession && pilotSession.status === 'ACTIVE') {
      const safeFetchJson = async (url: string) => {
        const response = await authFetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status} on ${url}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Invalid content-type on ${url}`);
        }
        return response.json();
      };

      interval = setInterval(async () => {
        try {
          // Optimize: Fetch all active pilot session parameters concurrently with Promise.allSettled to completely eliminate sequential waterfalls and prevent overall dashboard blockages
          const results = await Promise.allSettled([
            safeFetchJson(`/api/v1/pilot/sessions/${pilotSession.id}/metrics`),
            safeFetchJson(`/api/v1/pilot/sessions/${pilotSession.id}/logs`),
            safeFetchJson(`/api/v1/pilot/sessions/${pilotSession.id}/rdi`),
            safeFetchJson(`/api/v1/pilot/sessions/${pilotSession.id}/gtci`)
          ]);

          if (results[0].status === 'fulfilled') setPilotMetrics(results[0].value);
          if (results[1].status === 'fulfilled') setPilotLogs(results[1].value || []);
          if (results[2].status === 'fulfilled') setRdi(results[2].value);
          if (results[3].status === 'fulfilled') setGtci(results[3].value);
        } catch (err) {
          console.error('Failed to fetch metrics:', err);
        }
      }, 1000); // Polling optimized to 1000ms instead of 3000ms for live responsive tracking
    }
    return () => clearInterval(interval);
  }, [pilotSession]);

  const startPilot = async () => {
    try {
      const res = await authFetch('/api/v1/pilot/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: 'demo-class-1' })
      });
      const data = await res.json();
      setPilotSession(data);
    } catch (err) {
      console.error('Failed to start pilot:', err);
    }
  };

  const addObservation = async (content: string, type: string) => {
    if (!pilotSession) return;
    setRecording(true);
    try {
      const res = await authFetch('/api/v1/pilot/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: pilotSession.id, content, type })
      });
      const data = await res.json();
      setPilotLogs([data, ...pilotLogs]);
    } catch (err) {
      console.error('Failed to add observation:', err);
    } finally {
      setRecording(false);
    }
  };

  const requestIntervention = async (sessionId: string, action: string, payload: any) => {
    try {
      await authFetch('/api/v1/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          requester: AuthorityLevel.TEACHER,
          action,
          payload
        })
      });
    } catch (err) {
      console.error('Failed to request intervention:', err);
    }
  };

  if (loading || !classroom) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 italic">
        {lang === 'vi' ? 'Đang đồng bộ hóa khoang lái giáo viên...' : 'Syncing classroom cockpit...'}
      </div>
    );
  }

  const students = Object.values(classroom.activeStudents);

  return (
    <div className="space-y-12">
      {/* System Vitals & Learning SLOs */}
      
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{t.uptime}</span>
          </div>
          {latency !== null && (
            <div className="text-[10px] font-mono mt-1 flex items-center justify-between">
              <span className="text-slate-500">Live Trace Latency:</span>
              <span className={latency < 500 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{latency}ms</span>
            </div>
          )}
          <div className="text-xl font-mono text-white">{health?.uptime || 0}s</div>
          <div className="text-[10px] text-slate-600 mt-1">{t.statusNominal}</div>
        </div>
        
        {health?.learningSLOs.map((slo: any) => (
          <div key={slo.id} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <CheckCircle className={`w-4 h-4 ${slo.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{lang === 'vi' ? (slo.name === 'Concept Alignment Rate' ? 'Tỉ lệ căn chỉnh khái niệm' : slo.name === 'Average Competency Growth' ? 'Tăng trưởng năng lực TB' : slo.name === 'Scaffolding Intervention Speed' ? 'Tốc độ can thiệp Scaffold' : slo.name === 'Session Recovery Resilience' ? 'Khả năng phục hồi phiên học' : slo.name) : slo.name}</span>
              </div>
              <span className={`text-[8px] px-1 rounded font-bold ${slo.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {slo.status === 'HEALTHY' ? (lang === 'vi' ? 'KHOẺ' : 'HEALTHY') : (lang === 'vi' ? 'CẢNH BÁO' : 'WARNING')}
              </span>
            </div>
            <div className="text-xl font-mono text-white">
              {slo.unit === 'percent' ? `${(slo.currentValue * 100).toFixed(1)}%` : slo.currentValue}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">{lang === 'vi' ? 'Mục tiêu' : 'Target'}: {slo.unit === 'percent' ? `${(slo.targetValue * 100).toFixed(0)}%` : slo.targetValue}</div>
          </div>
        ))}
      </div>

      {/* Platform Stewardship & Auto-Recovery Telemetry */}
      {health?.sessionStoreTelemetry && (() => {
        const ratePercent = health.sessionStoreTelemetry.sessionRecoveryRate * 100;
        const stateLossCount = health.sessionStoreTelemetry.missingSessionsRequestsCount;
        
        const isRecoveryAlert = ratePercent < 99.0 && stateLossCount > 0;
        const isStateLossAlert = stateLossCount > 10;
        const hasActiveAlert = isRecoveryAlert || isStateLossAlert;

        return (
          <div className={`p-4 rounded-2xl border backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 -mt-6 transition-all duration-300 ${
            hasActiveAlert 
              ? 'bg-amber-950/20 border-amber-500/40' 
              : 'bg-slate-900/40 border-slate-800/80'
          }`}>
            <div className="flex items-center gap-3">
              {hasActiveAlert ? (
                <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse flex-shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white tracking-wide">
                    {lang === 'vi' ? 'HỆ THỐNG PHỤC HỒI PHIÊN TỰ ĐỘNG (AUTO-RECOVERY)' : 'ACTIVE SESSION RESILIENCE ENGINE'}
                  </p>
                  {hasActiveAlert && (
                    <span className="text-[8px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                      {lang === 'vi' ? 'Cảnh báo Ngưỡng' : 'Threshold Alert'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {lang === 'vi' 
                    ? 'Giám sát tính toàn vẹn trạng thái trong bộ nhớ và tự động phục hồi nếu máy chủ khởi động lại.' 
                    : 'Monitoring in-memory state preservation and gracefully healing state loss.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 bg-slate-950/40 px-4 py-2 rounded-xl border border-slate-900">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Active Memory</span>
                <span className="text-xs font-mono text-white font-semibold">
                  {health.sessionStoreTelemetry.activeSessionsCount} sessions
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block tracking-wider">State-Loss Queries</span>
                <span className={`text-xs font-mono font-semibold ${isStateLossAlert ? 'text-red-400 font-bold' : 'text-amber-500'}`}>
                  {stateLossCount} {isStateLossAlert && '⚠️'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Auto-Recreated</span>
                <span className="text-xs font-mono text-teal-400 font-semibold">
                  {health.sessionStoreTelemetry.recreatedSessionsCount}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block tracking-wider">Recovery Rate</span>
                <span className={`text-xs font-mono font-bold ${isRecoveryAlert ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                  {ratePercent.toFixed(1)}% {isRecoveryAlert && '⚠️'}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="space-y-6">
        {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          label={t.avgMastery} 
          value={`${(classroom.aggregates.averageAccuracy * 100).toFixed(0)}%`}
          icon={<BarChart3 className="w-4 h-4 text-blue-400" />}
          color="blue"
        />
        <StatCard 
          label={t.strugglingStudents} 
          value={classroom.aggregates.stugglingCount.toString()}
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          color="amber"
          alert={classroom.aggregates.stugglingCount > 0}
        />
        <StatCard 
          label={t.activeSessions} 
          value={students.length.toString()}
          icon={<Users className="w-4 h-4 text-emerald-400" />}
          color="emerald"
        />
      </div>

      {/* Student Heatmap/Grid */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          {t.liveRoster}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {students.length > 0 ? (
              students.map((student: any) => (
                <motion.div
                  key={student.studentId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-slate-200 truncate">{student.studentId}</h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(student.lastActive).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-400 uppercase tracking-wider font-bold mb-2">
                      {student.currentObjectId}
                    </p>
                    
                    {/* Mastery Bar */}
                    <div className="flex gap-1">
                      {student.competencies.map(comp => (
                        <div 
                          key={comp.competencyId}
                          className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden"
                          title={`${comp.competencyId}: ${(comp.masteryVector.accuracy * 100).toFixed(0)}%`}
                        >
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-1000"
                            style={{ width: `${comp.masteryVector.accuracy * 100}%` }}
                          />
                        </div>
                      ))}
                      {student.competencies.length === 0 && (
                        <div className="h-1.5 flex-1 bg-slate-800 rounded-full border border-slate-700/50" />
                      )}
                    </div>
                  </div>
                  
                    {student.competencies.some(c => c.masteryVector.accuracy < 0.4) && (
                    <div className="flex flex-col gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="self-end"
                      >
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      </motion.div>
                      <button 
                        onClick={() => requestIntervention(student.sessionId, 'FORCED_PAUSE', { reason: 'Teacher Intervention' })}
                        className="text-[10px] bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 px-2 py-1 rounded border border-amber-500/30 font-bold"
                      >
                        PAUSE
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-slate-500 italic border-2 border-dashed border-slate-800 rounded-2xl">
                No active students in this session.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Optimization & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Curriculum Effectiveness
          </h2>
          <div className="space-y-4">
            {metrics && Object.keys(metrics.curriculumEffectiveness).length > 0 ? (
              Object.values(metrics.curriculumEffectiveness).map((m: any) => (
                <div key={m.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-300">{m.id}</span>
                    <span className="text-xs text-emerald-400">{(m.successRate * 100).toFixed(0)}% Success</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500"
                      style={{ width: `${m.successRate * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                    <span>Sample Size: {m.sampleSize}</span>
                    <span>Struggle Rate: {(m.struggleRate * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-slate-500 italic">No curriculum data yet.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            AI Hint Impact
          </h2>
          <div className="space-y-4">
            {metrics && Object.keys(metrics.hintImpact).length > 0 ? (
              Object.values(metrics.hintImpact).map((m: any) => (
                <div key={m.id} className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-300">{m.id}</span>
                    <span className="text-xs text-purple-400">Impact: {(m.successRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500"
                      style={{ width: `${m.successRate * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-slate-500 italic">No hint data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum Version History */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-400" />
          Curriculum Governance: Active Versions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions.map((v) => (
            <div key={v.versionId} className={`p-4 rounded-xl border ${
              v.status === 'ACTIVE' ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-900/50 border-slate-700/50'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold font-mono text-slate-400">{v.versionId}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  v.status === 'ACTIVE' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  {v.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mb-4">{new Date(v.timestamp).toLocaleString()}</p>
              {v.status !== 'ACTIVE' && (
                <button 
                  onClick={() => activateVersion(v.versionId)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700 transition-all"
                >
                  ACTIVATE & ROLLBACK
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
          <Gavel className="w-5 h-5 text-purple-400" />
          Pedagogical Governance Log
        </h2>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {interventions.length > 0 ? (
            interventions.slice().reverse().map(int => (
              <div key={int.id} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-700/30 text-xs">
                <div className="flex items-center gap-3">
                  <ShieldAlert className={`w-4 h-4 ${int.status === 'APPROVED' ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <div>
                    <p className="text-slate-300 font-medium">
                      <span className="text-blue-400 font-bold">{int.requester}</span> requested <span className="text-purple-400 font-bold">{int.action}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">{int.sessionId} • {new Date(int.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  int.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {int.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center py-6 text-slate-500 italic">No interventions logged.</p>
          )}
        </div>
      </div>

      {/* Failure Mode Lab / Stress Testing */}
      <div className="bg-slate-900/40 rounded-2xl border border-red-500/30 p-8 backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Flame className="w-7 h-7 text-red-400" />
              Pedagogical Failure Mode Lab
            </h2>
            <p className="text-slate-400 text-sm mt-1">Simulating real-world chaos to verify system resilience</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => runStressTest('STUDENT_FATIGUE')}
              disabled={testing}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all"
            >
              Simulate Fatigue
            </button>
            <button
              onClick={() => runStressTest('ADVISORY_DRIFT')}
              disabled={testing}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold transition-all"
            >
              Simulate AI Drift
            </button>
            <button
              onClick={() => runStressTest('POLICY_EROSION')}
              disabled={testing}
              className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
            >
              Simulate Policy Erosion
            </button>
          </div>
        </div>

        {testResult && (
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-950/60 rounded-2xl border border-slate-800"
            >
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Stability</div>
                <div className={`text-lg font-mono font-bold ${testResult.systemStability === 'STABLE' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {testResult.systemStability}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Impact Score</div>
                <div className="text-lg font-mono text-white">{(testResult.impactScore * 10).toFixed(1)}/10</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Policy Violations</div>
                <div className="text-lg font-mono text-red-400">{testResult.policyViolations}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Velocity Impact</div>
                <div className="text-lg font-mono text-amber-400">{(testResult.learningVelocityDelta * 100).toFixed(0)}%</div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testResult.failureMatrix.map((mode: any) => (
                <div key={mode.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500">{mode.name}</span>
                    <span className={`text-[8px] px-1 rounded font-bold ${
                      mode.status === 'NOMINAL' ? 'bg-emerald-500/10 text-emerald-500' : 
                      mode.status === 'DEGRADED' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {mode.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{mode.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          mode.riskLevel === 'LOW' ? 'bg-emerald-500' : 
                          mode.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: mode.riskLevel === 'LOW' ? '20%' : mode.riskLevel === 'MEDIUM' ? '50%' : '90%' }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-600 font-mono">RISK: {mode.riskLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evolution Lab (Phase 10) */}
      <div className="bg-slate-900/40 rounded-2xl border border-blue-500/30 p-8 backdrop-blur-md shadow-[0_0_40px_rgba(37,99,235,0.1)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Microscope className="w-7 h-7 text-blue-400" />
              Curriculum Evolution Lab
            </h2>
            <p className="text-slate-400 text-sm mt-1">Autonomous intelligence optimizing pedagogical pathways</p>
          </div>
          <button
            onClick={generateProposal}
            disabled={simulating}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              simulating 
                ? 'bg-slate-800 text-slate-500' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
            }`}
          >
            {simulating ? (
              <>
                <Zap className="w-4 h-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                Propose Evolution
              </>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {proposal ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-blue-400 mb-4">AI Structural Analysis</h3>
                  <p className="text-slate-300 leading-relaxed italic">"{proposal.analysis}"</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Suggested Graph Mutations</h3>
                  {proposal.suggestedChanges.map((change: any, i: number) => (
                    <div key={i} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        change.action === 'ADD_BRANCH' ? 'bg-emerald-500/20 text-emerald-400' : 
                        change.action === 'REORDER' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-white">{change.objectId}</span>
                          <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                            {change.action}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{change.details}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Confidence</div>
                        <div className="text-sm font-mono text-blue-400">{(change.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-blue-600/10 rounded-2xl border border-blue-500/30">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-blue-400 mb-6">Outcome Simulation</h3>
                  <div className="space-y-6">
                    <SimulationMetric 
                      label="Predicted Success" 
                      value={`${(proposal.simulationResults.predictedSuccessRate * 100).toFixed(0)}%`}
                      delta={`+${(proposal.simulationResults.improvementDelta * 100).toFixed(0)}%`}
                    />
                    <SimulationMetric 
                      label="Est. Completion" 
                      value={`${(proposal.simulationResults.predictedCompletionTime / 60).toFixed(0)}m`}
                      delta="-12%"
                    />
                  </div>
                </div>
                <button 
                  onClick={applyEvolution}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl transition-all"
                >
                  Apply Evolution Strategy
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
              <Cpu className="w-12 h-12 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-600">Click "Propose Evolution" to run the curriculum intelligence optimizer.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Pilot Deployment Command Center */}
      <div className="bg-slate-900/40 rounded-2xl border border-emerald-500/30 p-8 backdrop-blur-md shadow-[0_0_40px_rgba(16,185,129,0.1)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Rocket className="w-7 h-7 text-emerald-400" />
              Pilot Command Center
            </h2>
            <p className="text-slate-400 text-sm mt-1">Real-world deployment management and observation hub</p>
          </div>
          {!pilotSession ? (
            <button 
              onClick={startPilot}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
            >
              Initialize Pilot Session
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE PILOT ACTIVE
              </span>
              <div className="text-xs font-mono text-slate-400">ID: {pilotSession.id.slice(0, 8)}</div>
            </div>
          )}
        </div>

        {pilotSession && (
          <div className="space-y-8">
            {/* Phase 11: Pilot Readiness & Reality Drift */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 p-6 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Pilot Readiness Contract (PRC v1.0)
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">VERSION: {pilotContract?.version}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Scope</div>
                    <div className="text-xs text-white">{pilotContract?.scope.gradeBand} / {pilotContract?.scope.subject}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Target Mastery</div>
                    <div className="text-xs text-emerald-400 font-mono">≥ {(pilotContract?.gates.minMasteryVelocity * 10).toFixed(1)}/10</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Max Cog. Load</div>
                    <div className="text-xs text-amber-400 font-mono">≤ {(pilotContract?.gates.maxTeacherCognitiveLoad * 100).toFixed(0)}%</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Contract Status</div>
                    <div className="text-xs text-emerald-500 font-bold">{pilotContract?.status}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-950/60 rounded-2xl border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.05)]">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center justify-between">
                  Reality Drift Index
                  <span className={`text-[10px] font-mono ${rdi?.compositeIndex > 0.4 ? 'text-red-400' : 'text-blue-400'}`}>
                    {(rdi?.compositeIndex || 0).toFixed(3)}
                  </span>
                </h3>
                <div className="space-y-3">
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${rdi?.compositeIndex > 0.4 ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{ width: `${(rdi?.compositeIndex || 0) * 100}%` }} 
                    />
                  </div>
                  <p className="text-[8px] text-slate-500 leading-tight">
                    {rdi?.compositeIndex > 0.4 
                      ? 'CRITICAL DIVERGENCE: Intended pedagogy and observed behavior are misaligned.' 
                      : 'NOMINAL ALIGNMENT: Reality is tracking within system expectations.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 12: Scientific Validation Protocol */}
            {validationProtocol && gtci && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 p-6 bg-slate-900/60 rounded-2xl border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Microscope className="w-4 h-4 text-purple-400" />
                      Scientific Validation Protocol v{validationProtocol.version}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      validationProtocol.status === 'CONCLUDED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {validationProtocol.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Control Group Setup</div>
                      <div className="text-xs text-white">{validationProtocol.controlGroupSetup}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Target GTCI</div>
                      <div className="text-xs text-purple-400 font-mono">≥ {validationProtocol.targetGtci.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Min Sample Size</div>
                      <div className="text-xs text-white font-mono">{gtci.sampleSize} / {validationProtocol.minimumSampleSize} samples</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-900/60 rounded-2xl border border-purple-500/30">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center justify-between">
                    Ground Truth Correlation
                    <span className={`text-[12px] font-mono font-bold ${
                      gtci.status === 'VALIDATED' ? 'text-emerald-400' : 
                      gtci.status === 'UNCORRELATED' ? 'text-amber-400' : 
                      gtci.status === 'INVERTED' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {(gtci.correlationScore || 0).toFixed(2)}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          gtci.status === 'VALIDATED' ? 'bg-emerald-500' : 
                          gtci.status === 'UNCORRELATED' ? 'bg-amber-500' : 
                          gtci.status === 'INVERTED' ? 'bg-red-500' : 'bg-slate-500'
                        }`} 
                        style={{ width: `${(gtci.correlationScore || 0) * 100}%` }} 
                      />
                    </div>
                    <p className="text-[8px] text-slate-500 leading-tight">
                      {gtci.status === 'VALIDATED' ? 'SCIENTIFICALLY VALIDATED: System mastery correlates strongly with external truth.' :
                       gtci.status === 'INSUFFICIENT_DATA' ? 'AWAITING DATA: Collecting external blind test scores.' :
                       gtci.status === 'INVERTED' ? 'METRIC GAMING DETECTED: Inverse correlation with reality.' :
                       'UNCORRELATED: System learning metrics do not reflect external reality.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Phase 13: Controlled Exposure Protocol */}
            {exposureProtocol && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 p-6 bg-slate-900/60 rounded-2xl border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      Controlled Exposure Protocol
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      exposureProtocol.status === 'ISOLATED' ? 'bg-emerald-500/10 text-emerald-500' : 
                      exposureProtocol.status === 'LEAKAGE_DETECTED' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {exposureProtocol.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-3">Anti-Gaming Constraints</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400">Dashboard Blindness</span>
                          <span className={`text-xs font-mono ${exposureProtocol.antiGamingConstraints.dashboardBlindness ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {exposureProtocol.antiGamingConstraints.dashboardBlindness ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400">Hint Delay Enforced</span>
                          <span className={`text-xs font-mono ${exposureProtocol.antiGamingConstraints.hintDelayEnforcement ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {exposureProtocol.antiGamingConstraints.hintDelayEnforcement ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400">Competency Obfuscation</span>
                          <span className={`text-xs font-mono ${exposureProtocol.antiGamingConstraints.competencyObfuscation ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {exposureProtocol.antiGamingConstraints.competencyObfuscation ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 col-span-2">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-3">Leakage Metrics</div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Gaming Attempts</div>
                          <div className={`text-lg font-mono ${exposureProtocol.leakageMetrics.gamingAttemptsDetected > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {exposureProtocol.leakageMetrics.gamingAttemptsDetected}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Teacher Bias</div>
                          <div className="text-lg font-mono text-amber-400">
                            {(exposureProtocol.leakageMetrics.teacherInterventionBias * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Adaptation Velocity</div>
                          <div className="text-lg font-mono text-emerald-400">
                            {(exposureProtocol.leakageMetrics.systemAdaptationVelocity * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-900/60 rounded-2xl border border-rose-500/30 flex flex-col justify-center items-center text-center">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Isolation Integrity</h3>
                  <div className={`text-4xl font-mono font-bold mb-2 ${
                    exposureProtocol.isolationIntegrityScore > 0.9 ? 'text-emerald-400' : 
                    exposureProtocol.isolationIntegrityScore > 0.7 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {(exposureProtocol.isolationIntegrityScore * 100).toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Measures how well the system is shielded from human behavior metric-gaming.
                  </p>
                </div>
              </div>
            )}

            {/* Phase 14: Behavioral Stress Test Protocol */}
            {stressProtocol && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 p-6 bg-slate-900/60 rounded-2xl border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      Behavioral Stress Test Protocol
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      stressProtocol.status === 'CONCLUDED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      {stressProtocol.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Adversarial Teacher</div>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-mono font-bold ${stressProtocol.simulations.adversarialTeacher.status === 'MITIGATED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stressProtocol.simulations.adversarialTeacher.status}
                        </span>
                        <span className="text-[10px] text-slate-400">Impact: {(stressProtocol.simulations.adversarialTeacher.impact * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Student Gaming</div>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-mono font-bold ${stressProtocol.simulations.studentStrategicGaming.status === 'DETECTED' ? 'text-amber-400' : 'text-rose-400'}`}>
                          {stressProtocol.simulations.studentStrategicGaming.status}
                        </span>
                        <span className="text-[10px] text-slate-400">Impact: {(stressProtocol.simulations.studentStrategicGaming.impact * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Metric Deception</div>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-mono font-bold ${stressProtocol.simulations.metricDeception.status === 'MITIGATED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stressProtocol.simulations.metricDeception.status}
                        </span>
                        <span className="text-[10px] text-slate-400">Impact: {(stressProtocol.simulations.metricDeception.impact * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Social Drift</div>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-mono font-bold ${stressProtocol.simulations.socialPressureDrift.status === 'DETECTED' ? 'text-amber-400' : 'text-rose-400'}`}>
                          {stressProtocol.simulations.socialPressureDrift.status}
                        </span>
                        <span className="text-[10px] text-slate-400">Impact: {(stressProtocol.simulations.socialPressureDrift.impact * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-900/60 rounded-2xl border border-orange-500/30 flex flex-col justify-center items-center text-center">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">System Resilience</h3>
                  <div className={`text-4xl font-mono font-bold mb-2 ${
                    stressProtocol.systemResilience > 0.8 ? 'text-emerald-400' : 
                    stressProtocol.systemResilience > 0.6 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {(stressProtocol.systemResilience * 100).toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Ability to maintain pedagogical truth against human behavioral exploitation.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Observation Input */}
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-400" />
                    Live Observation Log
                  </h3>
                  <div className="space-y-4">
                    <textarea 
                      placeholder="Enter pedagogical or technical observation..."
                      className="w-full bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 min-h-[100px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          addObservation(e.currentTarget.value, 'PEDAGOGICAL');
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => addObservation('Student frustration detected', 'BEHAVIORAL')} className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold transition-all">Behavioral Note</button>
                      <button onClick={() => addObservation('AI hint delay > 2s', 'TECHNICAL')} className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold transition-all">Technical Note</button>
                      <button onClick={() => addObservation('Intervention needed: Step 4', 'PEDAGOGICAL')} className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold transition-all">Pedagogical Critical</button>
                    </div>
                  </div>
                </div>

                {/* Real-time Logs */}
                <div className="space-y-3">
                  {pilotLogs.map((log: any) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={log.id} 
                      className="flex items-start gap-4 p-4 bg-slate-900/40 rounded-xl border border-slate-800/50"
                    >
                      <div className={`p-2 rounded-lg ${log.type === 'TECHNICAL' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'}`}>
                        <Activity className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-bold text-slate-400">{log.type}</span>
                          <span className="text-[8px] text-slate-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-300">{log.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {/* Pilot Success Matrix */}
                <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Success Matrix</h3>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                      pilotMetrics?.overallStatus === 'EXCELLENT' ? 'bg-emerald-500/10 text-emerald-500' : 
                      pilotMetrics?.overallStatus === 'STABLE' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {pilotMetrics?.overallStatus || 'NOMINAL'}
                    </span>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between text-[10px] mb-2">
                        <span className="text-slate-400">Mastery Velocity</span>
                        <span className="text-white font-mono">{((pilotMetrics?.pedagogical?.masteryVelocity || 0) * 10).toFixed(1)}/10</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${(pilotMetrics?.pedagogical?.masteryVelocity || 0) * 100}%` }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-[10px] mb-2">
                        <span className="text-slate-400">Hint Independence</span>
                        <span className="text-white font-mono">{((pilotMetrics?.pedagogical?.hintIndependence || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${(pilotMetrics?.pedagogical?.hintIndependence || 0) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-2">
                        <span className="text-slate-400">Teacher Cognitive Load</span>
                        <span className="text-white font-mono">{((pilotMetrics?.humanExperience?.teacherCognitiveLoad || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${pilotMetrics?.humanExperience?.teacherCognitiveLoad > 0.7 ? 'bg-red-500' : 'bg-slate-600'}`} style={{ width: `${(pilotMetrics?.humanExperience?.teacherCognitiveLoad || 0) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety Status */}
                <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Safety Thresholds</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                      <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Divergence</div>
                      <div className="text-xs font-mono text-emerald-400">{((pilotMetrics?.stability?.stateDivergence || 0) * 100).toFixed(1)}%</div>
                    </div>
                    <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                      <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Latency</div>
                      <div className="text-xs font-mono text-emerald-400">{pilotMetrics?.stability?.eventLatency || 0}ms</div>
                    </div>
                  </div>
                </div>

                {/* Safety Controls */}
                <div className="p-6 bg-red-950/20 rounded-2xl border border-red-500/20">
                  <h3 className="text-xs font-bold text-red-400 uppercase mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" />
                    Pilot Safety Controls
                  </h3>
                  <div className="space-y-2">
                    <button className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all">EMERGENCY KILL SESSION</button>
                    <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all">REVERT TO v1.0.0</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

function StatCard({ label, value, icon, color, alert }: any) {
  const colors: any = {
    blue: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
  };

  return (
    <div className={`p-4 rounded-2xl border backdrop-blur-sm transition-all ${colors[color]} ${alert ? 'animate-pulse border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : ''}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white leading-none">{value}</div>
    </div>
  );
}

function SimulationMetric({ label, value, delta }: { label: string, value: string, delta: string }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-mono text-white">{value}</span>
        <span className="text-xs text-emerald-400 font-bold">{delta}</span>
      </div>
    </div>
  );
}
