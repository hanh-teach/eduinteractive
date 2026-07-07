import { GoogleGenAI, Type } from "@google/genai";
import { optimizationEngine } from './optimization-engine.js';
import { CURRICULUM_GRAPH, LEARNING_OBJECTS } from './curriculum-store.js';
import { CurriculumEvolutionProposal } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class CurriculumEvolutionEngine {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
  }

  public async proposeEvolution(): Promise<CurriculumEvolutionProposal> {
    const metrics = optimizationEngine.getMetrics();
    
    if (!this.ai) {
      return {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        approvalStatus: 'PENDING',
        analysis: "AI Evolution Engine offline. No Gemini API key found.",
        suggestedChanges: [],
        simulationResults: { predictedSuccessRate: 0.8, predictedCompletionTime: 1200, improvementDelta: 0 }
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this curriculum state and optimization metrics. Propose structural changes to improve learning outcomes.
        
        Current Objects: ${JSON.stringify(LEARNING_OBJECTS)}
        Current Graph: ${JSON.stringify(CURRICULUM_GRAPH)}
        Metrics: ${JSON.stringify(metrics)}
        
        Vietnamese context (Tin học THCS).
        Return a JSON proposal.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              suggestedChanges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    objectId: { type: Type.STRING },
                    action: { type: Type.STRING, enum: ['REORDER', 'REPLACE', 'ADD_BRANCH'] },
                    details: { type: Type.STRING },
                    confidence: { type: Type.NUMBER }
                  },
                  required: ['objectId', 'action', 'details', 'confidence']
                }
              },
              simulationResults: {
                type: Type.OBJECT,
                properties: {
                  predictedSuccessRate: { type: Type.NUMBER },
                  predictedCompletionTime: { type: Type.NUMBER },
                  improvementDelta: { type: Type.NUMBER }
                }
              }
            },
            required: ['analysis', 'suggestedChanges', 'simulationResults']
          }
        }
      });

      const proposal = JSON.parse(response.text || '{}');
      return {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        approvalStatus: 'PENDING',
        ...proposal
      };
    } catch (err) {
      console.error('[EvolutionEngine] Gemini Error:', err);
      return {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        approvalStatus: 'PENDING',
        analysis: "Error during AI analysis. Falling back to heuristic defaults.",
        suggestedChanges: [
          { objectId: 'quiz-1', action: 'ADD_BRANCH', details: 'Add remedial video for struggling students', confidence: 0.7 }
        ],
        simulationResults: { predictedSuccessRate: 0.85, predictedCompletionTime: 1300, improvementDelta: 0.05 }
      };
    }
  }
}

export const curriculumEvolutionEngine = new CurriculumEvolutionEngine();
