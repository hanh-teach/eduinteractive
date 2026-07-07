const fs = require('fs');
let code = fs.readFileSync('src/server/runtime-engine.ts', 'utf-8');

const searchStr = `dispatcher.subscribe('SYS.LEARNING.VIDEO_COMPLETED', this.handleVideoCompleted.bind(this));`;
const replaceStr = `dispatcher.subscribe('SYS.LEARNING.VIDEO_COMPLETED', this.handleVideoCompleted.bind(this));
    dispatcher.subscribe('SYS.LEARNING.CODING_SUBMITTED', this.handleCodingSubmitted.bind(this));`;

const codingHandler = `
  private async handleCodingSubmitted(event: AppEvent) {
    const outcome = event.payload.correct ? 'onSuccess' : 'onFailure';
    // If it's correct we transition, if not we maybe transition to a struggle path or stay?
    // Let's just transition to onSuccess if correct, otherwise stay (return early)
    if (outcome === 'onSuccess') {
      await this.transitionState(event.sessionId, outcome, event.metadata.traceId);
    }
  }
`;

code = code.replace(searchStr, replaceStr);
code = code.replace(/  private async transitionState/, codingHandler + '  private async transitionState');

fs.writeFileSync('src/server/runtime-engine.ts', code);
