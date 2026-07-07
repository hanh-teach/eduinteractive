const fs = require('fs');
let code = fs.readFileSync('src/server/evidence-engine.ts', 'utf-8');

const handler = `
  private async handleCodingEvidence(event: AppEvent) {
    const { code, correct } = event.payload;
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
      metadata: { traceId: event.metadata.traceId, source: 'EvidenceEngine', class: EventClass.DERIVED }
    });
  }
`;

// It didn't replace because there's a space or something. We can replace `  }\n}\nexport const evidenceEngine` 
code = code.replace(/  }\n}\nexport const evidenceEngine/, `  }\n${handler}\n}\nexport const evidenceEngine`);

fs.writeFileSync('src/server/evidence-engine.ts', code);
