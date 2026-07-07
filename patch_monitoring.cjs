const fs = require('fs');
let code = fs.readFileSync('src/server/monitoring-engine.ts', 'utf-8');

const classVars = `  private hintsFollowedBySuccess: number = 0;
  private interventionsTriggered: number = 0;
  private interventionLatencySum: number = 0;`;

const newClassVars = `  private hintsFollowedBySuccess: number = 0;
  private interventionsTriggered: number = 0;
  private interventionLatencySum: number = 0;
  
  private competencyLatencySumMs: number = 0;
  private competencyUpdateCount: number = 0;
  private aiHintRealCount: number = 0;
  private aiHintFallbackCount: number = 0;`;

code = code.replace(classVars, newClassVars);

const subs = `    dispatcher.subscribe('ADVISORY.AI.HINT_OFFERED', async () => {
      this.hintsGiven++;
    });`;

const newSubs = `    dispatcher.subscribe('ADVISORY.AI.HINT_OFFERED', async (event) => {
      this.hintsGiven++;
      if (event.payload.advisory_source === 'AI') {
        this.aiHintRealCount++;
      } else {
        this.aiHintFallbackCount++;
      }
    });
    
    dispatcher.subscribe('DERIVED.COMPETENCY.UPDATED', async (event) => {
      // Calculate latency from timestamp if available in payload or event
      // If we assume the original event timestamp is somewhere, we'll just use a mock or rough estimate
      // Usually, derived events are created right after. We can check metadata.
      const now = Date.now();
      const eventTime = new Date(event.timestamp).getTime();
      const latency = now - eventTime;
      this.competencyLatencySumMs += latency;
      this.competencyUpdateCount++;
    });`;

code = code.replace(subs, newSubs);

const reportRet = `    return {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      learningSLOs: slos,
      eventThroughput: this.eventCount,
      activeSessions: this.activeSessions.size,
      sessionStoreTelemetry: getSessionStoreTelemetry()
    };`;

const newReportRet = `    return {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      learningSLOs: slos,
      eventThroughput: this.eventCount,
      activeSessions: this.activeSessions.size,
      averageCompetencyLatencyMs: this.competencyUpdateCount > 0 ? this.competencyLatencySumMs / this.competencyUpdateCount : 0,
      aiHintRealCount: this.aiHintRealCount,
      aiHintFallbackCount: this.aiHintFallbackCount,
      sessionStoreTelemetry: getSessionStoreTelemetry()
    };`;

code = code.replace(reportRet, newReportRet);

fs.writeFileSync('src/server/monitoring-engine.ts', code);
