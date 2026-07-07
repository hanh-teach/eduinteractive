import { PolicyRule, AuthorityLevel, InterventionRequest } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class PolicyEngine {
  private rules: Record<string, PolicyRule> = {
    'TRANSITION_CURRICULUM': {
      id: 'TRANSITION_CURRICULUM',
      actionType: 'STATE_TRANSITION',
      permittedAuthorities: [AuthorityLevel.CURRICULUM, AuthorityLevel.TEACHER, AuthorityLevel.SYSTEM],
      priority: 100
    },
    'AI_HINT': {
      id: 'AI_HINT',
      actionType: 'ADVISORY',
      permittedAuthorities: [AuthorityLevel.AI, AuthorityLevel.TEACHER],
      priority: 50
    },
    'FORCED_PAUSE': {
      id: 'FORCED_PAUSE',
      actionType: 'LIFECYCLE_CONTROL',
      permittedAuthorities: [AuthorityLevel.TEACHER, AuthorityLevel.SYSTEM],
      priority: 200
    }
  };

  private pendingInterventions: Record<string, InterventionRequest> = {};

  public isActionPermitted(actionType: string, authority: AuthorityLevel): boolean {
    const rule = this.rules[actionType];
    if (!rule) return false;
    return rule.permittedAuthorities.includes(authority);
  }

  public async requestIntervention(request: Omit<InterventionRequest, 'id' | 'status' | 'timestamp'>): Promise<InterventionRequest> {
    const intervention: InterventionRequest = {
      ...request,
      id: uuidv4(),
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };

    // Auto-approve if requester is TEACHER or SYSTEM
    if (intervention.requester === AuthorityLevel.TEACHER || intervention.requester === AuthorityLevel.SYSTEM) {
      intervention.status = 'APPROVED';
    }

    this.pendingInterventions[intervention.id] = intervention;
    console.log(`[PolicyEngine] Intervention ${intervention.id} (${intervention.action}) status: ${intervention.status}`);
    
    return intervention;
  }

  public getPendingInterventions(): InterventionRequest[] {
    return Object.values(this.pendingInterventions).filter(i => i.status === 'PENDING');
  }

  public getAllInterventions(): InterventionRequest[] {
    return Object.values(this.pendingInterventions);
  }
}

export const policyEngine = new PolicyEngine();
