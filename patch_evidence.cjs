const fs = require('fs');
let code = fs.readFileSync('src/server/evidence-engine.ts', 'utf-8');

const searchStr = `dispatcher.subscribe('SYS.LEARNING.QUIZ_SUBMITTED', this.handleQuizEvidence.bind(this));`;
const replaceStr = `dispatcher.subscribe('SYS.LEARNING.QUIZ_SUBMITTED', this.handleQuizEvidence.bind(this));
    dispatcher.subscribe('SYS.LEARNING.CODING_SUBMITTED', this.handleCodingEvidence.bind(this));`;

const codingEvidenceHandler = `

  private async handleCodingEvidence(event: AppEvent) {
    const { code, correct } = event.payload;
    
    console.log(\`[EvidenceEngine] [TRACE: \${event.metadata.traceId || 'N/A'}] Processing coding evidence for session \${event.sessionId}\`);
    const evidence: EvidenceArtifact = {
      evidenceId: uuidv4(),
      sessionId: event.sessionId,
      studentId: event.actorId,
      competencyIds: ['python.logic.if_statements'],
      payload: { 
        interactionType: 'coding',
        outcome: correct ? 'SUCCESS' : 'FAILURE',
        details: { code }
      },
      confidenceScore: correct ? 0.95 : 0.3,
      timestamp: new Date().toISOString()
    };

    await saveEvidence(evidence);

    await dispatcher.dispatch({
      eventId: uuidv4(),
      eventType: 'DERIVED.EVIDENCE.CREATED',
      version: '1.0.0',
      sessionId: event.sessionId,
      timestamp: new Date().toISOString(),
      actorId: 'EvidenceEngine',
      payload: evidence,
      metadata: {
        traceId: event.metadata.traceId,
        source: 'EvidenceEngine',
        class: EventClass.DERIVED
      }
    });
  }
`;

code = code.replace(searchStr, replaceStr);
code = code.replace(/}\nexport const evidenceEngine/, codingEvidenceHandler + '\n}\nexport const evidenceEngine');

fs.writeFileSync('src/server/evidence-engine.ts', code);
