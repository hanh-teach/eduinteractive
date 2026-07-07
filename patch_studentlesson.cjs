const fs = require('fs');
let code = fs.readFileSync('src/components/StudentLesson.tsx', 'utf-8');

// Add events to props
code = code.replace(`  competencies: any[];
  lang: 'vi' | 'en';`, `  competencies: any[];
  events: any[];
  lang: 'vi' | 'en';`);

code = code.replace(/export function StudentLesson.*\{/, `export function StudentLesson({ sessionId, sessionState, ingestActivity, competencies, events, lang }: StudentLessonProps) {`);

// Pass events to LessonSummary
code = code.replace(`<LessonSummary competencies={competencies} lang={lang} />`, `<LessonSummary competencies={competencies} events={events} lang={lang} />`);

// Update LessonSummary interface
code = code.replace(`function LessonSummary({ competencies, lang }: { competencies: any[], lang: 'vi' | 'en' }) {`, `function LessonSummary({ competencies, events, lang }: { competencies: any[], events: any[], lang: 'vi' | 'en' }) {
  const hints = events.filter((e: any) => e.eventType === 'ADVISORY.AI.HINT_OFFERED');
  const latestHint = hints.length > 0 ? hints[hints.length - 1].payload : null;
`);

// Add dynamic hint display
const oldSummaryHtml = `<div className="bg-blue-900/20 border border-blue-800 rounded-xl p-6 text-left">
        <h4 className="text-blue-400 text-sm uppercase tracking-wider mb-2 font-bold">AI Recommendation</h4>
        <p className="text-slate-300">Based on your performance, we recommend moving on to <strong className="text-white">Else & Elif Statements</strong>.</p>
      </div>`;
const newSummaryHtml = `<div className="bg-blue-900/20 border border-blue-800 rounded-xl p-6 text-left">
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
      </div>`;

code = code.replace(oldSummaryHtml, newSummaryHtml);

fs.writeFileSync('src/components/StudentLesson.tsx', code);
