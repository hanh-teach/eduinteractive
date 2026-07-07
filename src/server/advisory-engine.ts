import { GoogleGenAI } from "@google/genai";
import { dispatcher } from './dispatcher.js';
import { getLearningObject } from './curriculum-store.js';
import { AppEvent, EventClass, CompetencyState, MasteryStage } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class AdvisoryEngine {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Listen for competency updates
    dispatcher.subscribe('DERIVED.COMPETENCY.UPDATED', this.evaluatePedagogy.bind(this));
  }

  private async evaluatePedagogy(event: AppEvent) {
    const compState = event.payload as CompetencyState;
    
    // Logic: If accuracy is low and stage is EMERGING, offer a hint
    if (compState.masteryVector.accuracy < 0.4 && compState.masteryStage === MasteryStage.EMERGING) {
      console.log(`[AdvisoryEngine] [TRACE: ${event.metadata.traceId || 'N/A'}] Student struggling with ${compState.competencyId}. Generating contextual hint...`);
      
      const { hint, source } = await this.generateHint(compState);
      
      await dispatcher.dispatch({
        eventId: uuidv4(),
        eventType: 'ADVISORY.AI.HINT_OFFERED',
        version: '1.0.0',
        sessionId: event.sessionId,
        timestamp: new Date().toISOString(),
        actorId: 'AdvisoryEngine',
        payload: {
          hint,
          competencyId: compState.competencyId,
          recommendation: 'REVIEW_CONCEPT',
          advisory_source: source
        },
        metadata: {
          traceId: event.metadata.traceId,
          source: 'AdvisoryEngine',
          class: EventClass.ADVISORY,
          origin: event.metadata.origin
        }
      });
    }
  }

  private async generateHint(state: CompetencyState): Promise<{ hint: string; source: 'AI' | 'FALLBACK' }> {
    if (!process.env.GEMINI_API_KEY) {
      return {
        hint: "Take a deep breath! Remember that Python 'if' statements help your code make decisions.",
        source: 'FALLBACK'
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Student is struggling with competency: ${state.competencyId}. 
        Current Accuracy: ${state.masteryVector.accuracy}. 
        Provide a short pedagogical hint for a beginner learning Python branching logic. 
        Focus on scaffolding the concept of 'decisions in code'. 
        Vietnamese context is preferred but keep it simple.`,
        config: {
          systemInstruction: "You are an expert pedagogical AI for EduInteractive OS. Vietnamese language.",
        }
      });
      
      return {
        hint: response.text || "Hãy nhớ rằng lệnh 'if' giúp code của bạn đưa ra quyết định!",
        source: response.text ? 'AI' : 'FALLBACK'
      };
    } catch (err: any) {
      if (err.message && err.message.includes('503')) {
        console.warn('[AdvisoryEngine] Gemini 503 error: Model busy, using fallback.');
      } else {
        console.error('[AdvisoryEngine] Gemini error:', err);
      }
      return {
        hint: "Đừng bỏ cuộc! Hãy xem lại cách hoạt động của lệnh 'if'.",
        source: 'FALLBACK'
      };
    }
  }
}

export const advisoryEngine = new AdvisoryEngine();
