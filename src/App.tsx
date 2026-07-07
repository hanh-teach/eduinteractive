import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Play, Activity, CheckCircle, Database, Cpu, Users, Sun, Moon, Monitor, Eye, AlertTriangle, X } from 'lucide-react';
import { auth } from './firebase';
import { signInWithCustomToken, onAuthStateChanged, User, getIdToken } from 'firebase/auth';

import { TeacherLogin } from './components/TeacherLogin';
import { StudentLesson } from './components/StudentLesson';
import { ClassroomCockpit } from './components/ClassroomCockpit';
import { translations } from './translations';

export default function App() {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleLoginSuccess = (u: any, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('edu_os_token', t);
    localStorage.setItem('edu_os_user', JSON.stringify(u));
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('edu_os_token');
    const savedUser = localStorage.getItem('edu_os_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('edu_os_token');
    localStorage.removeItem('edu_os_user');
  };
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<any>(null);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedRecreatedAt, setDismissedRecreatedAt] = useState<string | null>(null);

  const [lang, setLang] = useState<'vi' | 'en'>(() => {
    return (localStorage.getItem('edu_os_lang') as 'vi' | 'en') || 'vi';
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    return (localStorage.getItem('edu_os_theme') as 'light' | 'dark' | 'auto') || 'dark';
  });

  const [eyeCare, setEyeCare] = useState<boolean>(() => {
    return localStorage.getItem('edu_os_eyecare') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (eyeCare) {
      root.classList.add('eye-care');
    } else {
      root.classList.remove('eye-care');
    }
    localStorage.setItem('edu_os_eyecare', String(eyeCare));
  }, [eyeCare]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    
    const applyTheme = () => {
      if (theme === 'auto') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(`theme-${systemTheme}`);
      } else {
        root.classList.add(`theme-${theme}`);
      }
    };

    applyTheme();
    localStorage.setItem('edu_os_theme', theme);

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('edu_os_lang', lang);
  }, [lang]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const t = await getIdToken(u);
        setToken(t);
      } else {
        setUser(null);
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (viewMode === 'student' && !user) {
      const loginAnon = async () => {
        try {
          const res = await fetch('/api/v1/student/register-anonymous', { method: 'POST' });
          const data = await res.json();
          if (data.token) {
            // Bypass Firebase sign-in due to signBlob permission issues
            setToken(data.token);
            setUser({ uid: data.uid, email: null, isAnonymous: true } as any);
          } else {
            console.error('No token returned from anonymous registration endpoint');
          }
        } catch (err) {
          console.error('Anonymous registration failed:', err);
        }
      };
      loginAnon();
    }
  }, [viewMode, user]);

  const t = translations[lang];

  const fetchSessionData = async (targetSessionId: string) => {
    if (!targetSessionId) return;
    try {
      const cycleCorrelationId = `corr-poll-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;

      const safeFetchJson = async (url: string, extraHeaders?: Record<string, string>) => {
        const headers: Record<string, string> = {
          'x-correlation-id': cycleCorrelationId,
          ...(extraHeaders || {})
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status} on ${url}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Invalid content-type on ${url}`);
        }
        return response.json();
      };

      // Optimize: Fetch all states in parallel with Promise.allSettled to avoid HTTP waterfall delays and resist partial endpoint failures
      const results = await Promise.allSettled([
        safeFetchJson(`/api/v1/sessions/${targetSessionId}/events`),
        safeFetchJson(`/api/v1/sessions/${targetSessionId}/state`, {
          'x-session-generation': sessionState?.sessionGeneration?.toString() || '0'
        }),
        safeFetchJson(`/api/v1/students/${user?.uid || 'student-123'}/competencies`)
      ]);

      const eventRes = results[0];
      const stateRes = results[1];
      const compRes = results[2];

      if (eventRes.status === 'fulfilled') {
        setEvents(eventRes.value.events || []);
      } else {
        console.warn('Failed to fetch session events:', eventRes.reason);
      }

      if (stateRes.status === 'fulfilled') {
        setSessionState(stateRes.value);
      } else {
        console.warn('Failed to fetch session state:', stateRes.reason);
      }

      if (compRes.status === 'fulfilled') {
        setCompetencies(compRes.value.competencies || []);
      } else {
        console.warn('Failed to fetch student competencies:', compRes.reason);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    if (!sessionId) return;

    // Polling interval optimized from 3000ms to 1000ms for sub-second synchronization latency
    const interval = setInterval(() => {
      fetchSessionData(sessionId);
    }, 1000);
    
    fetchSessionData(sessionId); // Initial fast-fetch

    return () => clearInterval(interval);
  }, [sessionId]);

  const startSession = async () => {
    setLoading(true);
    try {
      const cycleCorrelationId = `corr-start-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-correlation-id': cycleCorrelationId
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ studentId: user?.uid || 'student-123', lessonId: 'python-if-intro' })
      });
      const data = await res.json();
      setSessionId(data.sessionId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ingestActivity = async (type: string, payload: any) => {
    if (!sessionId) return;
    try {
      const cycleCorrelationId = `corr-ingest-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-correlation-id': cycleCorrelationId
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch('/api/v1/events/ingest', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId, type, payload, actorId: user?.uid || 'student-123' })
      });
      // Optimize: Instant state synchronization after student activity ingestion
      fetchSessionData(sessionId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-text-main font-sans p-8 transition-colors duration-300">
      <header className="max-w-7xl mx-auto mb-10 flex flex-wrap items-center justify-between gap-4 bg-header-bg p-4 rounded-2xl border border-border-custom backdrop-blur-md transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-main tracking-tight">EduInteractive <span className="text-blue-500">OS</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Classroom OS v1.0</p>
          </div>
        </div>

        <div className="flex bg-bg-input p-1 rounded-xl border border-border-custom transition-colors duration-300">
          <button
            onClick={() => setViewMode('student')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'student' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {t.studentView}
          </button>
          <button
            onClick={() => setViewMode('teacher')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'teacher' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {t.teacherCockpit}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Language Selection Widget */}
          <div className="flex items-center gap-1 bg-bg-input p-1 rounded-xl border border-border-custom transition-colors duration-300">
            <button
              onClick={() => setLang('vi')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                lang === 'vi' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-400'
              }`}
              title="Tiếng Việt"
            >
              VI
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                lang === 'en' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-400'
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Theme & Eye Protection Widget */}
          <div className="flex items-center gap-1 bg-bg-input p-1 rounded-xl border border-border-custom transition-colors duration-300">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'light' ? 'bg-amber-500/20 text-amber-500 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-400'
              }`}
              title={t.lightMode}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'dark' ? 'bg-blue-500/20 text-blue-500 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-400'
              }`}
              title={t.darkMode}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('auto')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'auto' ? 'bg-slate-500/20 text-slate-500 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-400'
              }`}
              title={t.autoMode}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>

            {/* Subtle internal separator divider */}
            <div className="w-[1px] h-3.5 bg-border-custom/60 mx-0.5 self-center" />

            <button
              onClick={() => setEyeCare(!eyeCare)}
              className={`p-1.5 rounded-lg transition-all ${
                eyeCare 
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold shadow-sm' 
                  : 'text-slate-500 hover:text-slate-400'
              }`}
              title={t.eyeProtection}
              aria-label={t.eyeProtection}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              <X className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase">{lang === 'vi' ? 'Thoát' : 'Logout'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-bg-input px-3 py-1.5 rounded-xl border border-border-custom transition-colors duration-300">
            <div className={`h-2 w-2 rounded-full ${sessionId ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {sessionId ? t.live : t.offline}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {viewMode === 'teacher' ? (
          (user && user.email) ? (
            <ClassroomCockpit lang={lang} theme={theme} token={token} />
          ) : (
            <TeacherLogin lang={lang} onLoginSuccess={handleLoginSuccess} />
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Control Panel */}
            <section className="lg:col-span-8 space-y-6 min-w-0">
              <div className="bg-card-bg rounded-2xl border border-border-custom p-6 backdrop-blur-sm transition-colors duration-300">
                <h2 className="text-lg font-medium text-text-main mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  {t.runtimeControls}
                </h2>
                
                {!sessionId ? (
                  <button
                    onClick={startSession}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-900/20"
                  >
                    {loading ? t.initializing : (
                      <>
                        <Play className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        {t.startHeroLesson}
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    {sessionState?.sessionRecreated && sessionState?.recreatedAt !== dismissedRecreatedAt && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-amber-600 dark:text-amber-400 text-xs transition-colors duration-300 relative group/banner">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                        <div className="pr-6">
                          <p className="font-semibold">
                            {lang === 'vi' ? 'Phiên học đã tự động phục hồi' : 'Session Auto-Recovered'}
                          </p>
                          <p className="text-[11px] opacity-90 mt-0.5">
                            {lang === 'vi' 
                              ? 'Bộ nhớ máy chủ đã khởi động lại. Phiên học đã được tái tạo an toàn với cấu hình mặc định.' 
                              : 'The memory store restarted. This session has been gracefully recreated with default state.'}
                          </p>
                          <div className="mt-2 pt-2 border-t border-amber-500/10 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-amber-700 dark:text-amber-300">
                            <span>Gen: <strong>{sessionState.sessionGeneration}</strong></span>
                            <span>Reason: <strong>{sessionState.recoveryReason || 'UNKNOWN'}</strong></span>
                            {sessionState.recreatedAt && (
                              <span>Time: <strong>{new Date(sessionState.recreatedAt).toLocaleTimeString()}</strong></span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => setDismissedRecreatedAt(sessionState.recreatedAt || '')}
                          className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all"
                          title={lang === 'vi' ? 'Đóng thông báo' : 'Dismiss message'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-end gap-2">
                        <p className="text-xs font-mono text-text-sub break-all bg-bg-input p-2 rounded flex-1 border border-border-custom transition-colors duration-300">
                          ID: {sessionId}
                        </p>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] uppercase text-slate-500 block mb-1">Progress</span>
                          <span className="text-emerald-500 font-bold">{sessionState?.context?.progress || 0}%</span>
                        </div>
                      </div>
                      
                      {sessionState?.correlationId && (
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 bg-bg-input/60 p-2 rounded border border-border-custom/40">
                          <span>Trace: <strong className="text-slate-600 dark:text-slate-300 break-all">{sessionState.correlationId}</strong></span>
                          {sessionState?.sessionGeneration !== undefined && (
                            <span>Gen: <strong className="text-slate-600 dark:text-slate-300">{sessionState.sessionGeneration}</strong></span>
                          )}
                        </div>
                      )}
                    </div>



                    
                    {/* Integrated Student Lesson View */}
                    <StudentLesson 
                      sessionId={sessionId}
                      sessionState={sessionState}
                      ingestActivity={ingestActivity}
                      competencies={competencies}
                      events={events}
                      lang={lang}
                    />

                  </div>
                )}
              </div>

              <div className="bg-card-bg rounded-2xl border border-border-custom p-6 backdrop-blur-sm transition-colors duration-300">
                <h2 className="text-lg font-medium text-text-main mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  {t.masteryGraph}
                </h2>
                <ul className="space-y-3 text-sm text-text-sub">
                  {competencies.length > 0 ? (
                    competencies.map(comp => (
                      <li key={comp.competencyId} className="p-3 bg-bg-input rounded-xl border border-border-custom transition-colors duration-300">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-text-main">{comp.competencyId.split('.').pop()?.replace(/_/g, ' ')}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-500 font-bold uppercase tracking-wider">
                            {comp.masteryStage}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${comp.masteryVector.accuracy * 100}%` }}
                            className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                          <span>Accuracy: {(comp.masteryVector.accuracy * 100).toFixed(0)}%</span>
                          <span>Consistency: {(comp.masteryVector.consistency * 100).toFixed(0)}%</span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic text-center py-4">{t.noCompetencies}</li>
                  )}
                </ul>
              </div>

              {/* AI Advisory Panel */}
              <AnimatePresence>
                {events.some(e => e.eventType === 'ADVISORY.AI.HINT_OFFERED') && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-purple-500/10 rounded-2xl border border-purple-500/30 p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(168,85,247,0.08)] transition-colors duration-300"
                  >
                    <h2 className="text-lg font-medium text-purple-600 dark:text-purple-300 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-500" />
                      AI Advisory Scaffolding
                    </h2>
                    <div className="space-y-4">
                      {events
                        .filter(e => e.eventType === 'ADVISORY.AI.HINT_OFFERED')
                        .slice(-1)
                        .map(e => (
                          <div key={e.eventId} className="bg-bg-input p-4 rounded-xl border border-purple-500/20 transition-colors duration-300">
                            <p className="text-sm text-text-main leading-relaxed">
                              "{e.payload.hint}"
                            </p>
                            <div className="mt-3 pt-3 border-t border-purple-500/10 flex justify-between items-center">
                              <span className="text-[10px] font-mono text-purple-500 uppercase tracking-wider font-semibold">
                                Recommendation: {e.payload.recommendation}
                              </span>
                              <span className="text-[10px] text-slate-500 italic">
                                {new Date(e.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Event Log (The "TiVo" View) */}
            <section className="lg:col-span-4 bg-card-bg rounded-2xl border border-border-custom overflow-hidden flex flex-col h-[500px] min-w-0 transition-colors duration-300">
              <div className="bg-header-bg px-4 py-3 border-b border-border-custom flex items-center justify-between transition-colors duration-300">
                <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-500" />
                  {t.backboneStream}
                </h2>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500/50" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                  <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                <AnimatePresence mode="popLayout">
                  {!sessionId ? (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-slate-500 italic"
                    >
                      {t.waitingEvents}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="connected"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-emerald-600 dark:text-emerald-400"
                    >
                      {`> ${lang === 'vi' ? 'Kết nối thành công. Đang lắng nghe sự kiện...' : 'Connection established. Listening for events...'}`}
                    </motion.div>
                  )}
                  
                  {events.map((event) => (
                    <motion.div
                      key={event.eventId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-2 rounded border transition-all duration-300 ${
                        event.eventType === 'DERIVED.SESSION.ADAPTIVE_TRANSITION' 
                          ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.05)] text-text-main' 
                          : 'bg-bg-input border-border-custom text-text-main'
                      }`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className={`font-bold ${
                          event.eventType === 'DERIVED.SESSION.ADAPTIVE_TRANSITION' ? 'text-purple-500' : 'text-blue-500 font-semibold'
                        }`}>
                          {event.eventType}
                        </span>
                        <span className="text-slate-500 text-[10px]">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <pre className="text-[10px] text-text-sub overflow-hidden text-ellipsis whitespace-pre-wrap break-all font-mono">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </motion.div>
                  ))}

                  <div key="system-ready" className="text-slate-500 italic">
                    {t.systemReady}
                  </div>
                </AnimatePresence>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
