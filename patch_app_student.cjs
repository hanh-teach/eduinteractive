const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const importStatement = "import { StudentLesson } from './components/StudentLesson';\n";
code = code.replace(/import { ClassroomCockpit }/, importStatement + 'import { ClassroomCockpit }');

const searchStr = `                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => ingestActivity('SYS.LEARNING.VIDEO_COMPLETED', { position: 180 })}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 px-4 rounded-lg transition-colors font-semibold shadow"
                      >
                        {lang === 'vi' ? 'Hoàn thành Video' : 'Finish Video'}
                      </button>
                      <button
                        onClick={() => ingestActivity('SYS.LEARNING.QUIZ_SUBMITTED', { answer: 'A', correct: true })}
                        className="bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 px-4 rounded-lg transition-colors shadow"
                      >
                        {lang === 'vi' ? 'Đạt câu hỏi ngắn' : 'Pass Quiz'}
                      </button>
                      <button
                        onClick={() => ingestActivity('SYS.LEARNING.QUIZ_SUBMITTED', { answer: 'B', correct: false })}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm py-2 px-4 rounded-lg transition-colors border border-red-500/30"
                      >
                        {lang === 'vi' ? 'Sai câu hỏi ngắn' : 'Fail Quiz (Adaptive)'}
                      </button>
                      <button
                        onClick={() => ingestActivity('SYS.LEARNING.STAGNATION_DETECTED', { timeSpent: 300 })}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-sm py-2 px-4 rounded-lg transition-colors border border-amber-500/30"
                      >
                        {lang === 'vi' ? 'Tín hiệu Gặp khó' : 'Struggle Signal'}
                      </button>
                    </div>`;

const replaceStr = `                    
                    {/* Integrated Student Lesson View */}
                    <StudentLesson 
                      sessionId={sessionId}
                      sessionState={sessionState}
                      ingestActivity={ingestActivity}
                      competencies={competencies}
                      lang={lang}
                    />
`;

code = code.replace(searchStr, replaceStr);

// Also remove "Current Object" generic display to make it cleaner
const searchStr2 = `                    <div className="p-4 bg-bg-input rounded-xl border border-border-custom transition-colors duration-300">
                      <span className="text-[10px] uppercase text-slate-500 block mb-1">Current Object</span>
                      <p className="text-sm font-medium text-blue-500">
                        {sessionState?.currentObjectId || 'Loading...'}
                      </p>
                    </div>`;
code = code.replace(searchStr2, "");


fs.writeFileSync('src/App.tsx', code);
