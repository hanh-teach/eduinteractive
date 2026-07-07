import React, { useState } from 'react';
import { Play, Pause, CheckCircle, Code, ChevronRight, Check } from 'lucide-react';
import { translations } from '../translations';

interface StudentLessonProps {
  sessionId: string;
  sessionState: any;
  ingestActivity: (type: string, payload: any) => void;
  competencies: any[];
  events: any[];
  lang: 'vi' | 'en';
}

export function StudentLesson({ sessionId, sessionState, ingestActivity, competencies, events, lang }: StudentLessonProps) {
  const t = translations[lang];
  const currentObject = sessionState?.currentObjectId;
  const progress = sessionState?.context?.progress || 0;

  if (!currentObject) return <div>Loading...</div>;

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">
          {currentObject === 'intro-video' && 'Video: Welcome to Python Logic'}
          {currentObject === 'quiz-1' && 'Quiz: Conditional Concept Check'}
          {currentObject === 'coding-1' && 'Challenge: Hero Decision Script'}
          {currentObject === 'summary' && 'Lesson Summary'}
        </h3>
        <div className="text-sm font-mono text-slate-400">
          Progress: <span className="text-emerald-400">{progress}%</span>
        </div>
      </div>

      <div className="min-h-[400px]">
        {currentObject === 'intro-video' && (
          <VideoPlayer ingestActivity={ingestActivity} lang={lang} />
        )}
        {currentObject === 'quiz-1' && (
          <QuizComponent ingestActivity={ingestActivity} lang={lang} />
        )}
        {currentObject === 'coding-1' && (
          <CodingChallenge ingestActivity={ingestActivity} lang={lang} />
        )}
        {currentObject === 'summary' && (
          <LessonSummary competencies={competencies} events={events} lang={lang} />
        )}
      </div>
    </div>
  );
}

function VideoPlayer({ ingestActivity, lang }: { ingestActivity: any, lang: 'vi' | 'en' }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (playing) {
      ingestActivity('SYS.LEARNING.VIDEO_PAUSED', { position: progress });
    }
    setPlaying(!playing);
  };

  const completeVideo = () => {
    ingestActivity('SYS.LEARNING.VIDEO_COMPLETED', { position: 180 });
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 h-[400px] bg-black/40 rounded-xl border border-slate-800">
      <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-500 transition-colors" onClick={togglePlay}>
        {playing ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white translate-x-1" />}
      </div>
      <p className="text-slate-400 text-sm">
        {playing ? 'Video is playing...' : 'Video is paused'}
      </p>
      
      <button onClick={completeVideo} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors mt-8 flex items-center gap-2">
        <span>Skip to End</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function QuizComponent({ ingestActivity, lang }: { ingestActivity: any, lang: 'vi' | 'en' }) {
  const [selected, setSelected] = useState<string | null>(null);
  
  const handleSubmit = () => {
    if (!selected) return;
    const correct = selected === 'A'; // Let's say A is correct
    ingestActivity('SYS.LEARNING.QUIZ_SUBMITTED', { answer: selected, correct });
  };

  return (
    <div className="space-y-6">
      <p className="text-lg text-slate-200">What is the purpose of an 'if' statement in Python?</p>
      <div className="space-y-3">
        {['A. To execute code only when a condition is true', 'B. To loop through a list of items', 'C. To define a new function'].map((opt, i) => {
          const val = String.fromCharCode(65 + i);
          return (
            <div 
              key={val} 
              onClick={() => setSelected(val)}
              className={`p-4 rounded-xl border cursor-pointer transition-colors ${selected === val ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500'}`}
            >
              {opt}
            </div>
          )
        })}
      </div>
      <button 
        onClick={handleSubmit} 
        disabled={!selected}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
      >
        Submit Answer
      </button>
    </div>
  );
}

function CodingChallenge({ ingestActivity, lang }: { ingestActivity: any, lang: 'vi' | 'en' }) {
  const [code, setCode] = useState("hero_hp = 10\n\n# Check if hero_hp is greater than 0\n");

  const handleRun = () => {
    // Simple verification
    const correct = code.includes("if hero_hp > 0:") || code.includes("if hero_hp>0:");
    ingestActivity('SYS.LEARNING.CODING_SUBMITTED', { code, correct });
  };

  return (
    <div className="space-y-4">
      <p className="text-slate-300">Complete the if statement to check if the hero is alive.</p>
      <div className="bg-slate-950 rounded-xl p-4 font-mono text-sm border border-slate-800">
        <textarea 
          value={code} 
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-40 bg-transparent text-emerald-400 focus:outline-none resize-none"
          spellCheck={false}
        />
      </div>
      <button onClick={handleRun} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2">
        <Code className="w-4 h-4" />
        <span>Run Code</span>
      </button>
    </div>
  );
}

function LessonSummary({ competencies, events, lang }: { competencies: any[], events: any[], lang: 'vi' | 'en' }) {
  const hints = events.filter((e: any) => e.eventType === 'ADVISORY.AI.HINT_OFFERED');
  const latestHint = hints.length > 0 ? hints[hints.length - 1].payload : null;

  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-white">Lesson Completed!</h2>
      
      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6 text-left">
        <h4 className="text-slate-400 text-sm uppercase tracking-wider mb-4 font-bold">Your Competencies</h4>
        {competencies.length === 0 ? (
          <p className="text-slate-500 italic">Processing...</p>
        ) : (
          <div className="space-y-4">
            {competencies.map(c => (
              <div key={c.competencyId} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                <span className="font-mono text-sm text-slate-300">{c.competencyId}</span>
                <div className="flex gap-4 items-center">
                  <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">{c.masteryStage}</span>
                  <span className="font-bold text-emerald-400">{(c.masteryVector.accuracy * 100).toFixed(0)}% Acc</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-6 text-left">
        <h4 className="text-blue-400 text-sm uppercase tracking-wider mb-2 font-bold">
          {lang === 'vi' ? 'Khuyến nghị & Gợi ý từ AI' : 'AI Recommendation'}
        </h4>
        {latestHint ? (
          <div>
            <p className="text-slate-300 mb-2">{latestHint.hint}</p>
            <p className="text-xs text-blue-500 font-mono">Source: {latestHint.advisory_source}</p>
          </div>
        ) : (
          <p className="text-slate-300">
             {lang === 'vi' ? 'Bạn làm rất tốt! Đề xuất bài tiếp theo:' : 'Great job! Recommended next:'} 
             <strong className="text-white ml-2">Else & Elif Statements</strong>
          </p>
        )}
      </div>
    </div>
  );
}
