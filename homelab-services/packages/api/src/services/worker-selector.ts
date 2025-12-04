import type { AgentType, AgentSelectionResult } from '@homelab/validators';

/**
 * Agent selection keywords mapping
 * Maps technology keywords to specialized agent types
 */
const AGENT_KEYWORDS: Record<AgentType, string[]> = {
  't3-stack-developer': [
    'trpc', 't3', 't3-stack', 'typescript', 'react', 'next.js', 'nextjs',
    'drizzle', 'zod', 'validation', 'react-query', 'tanstack',
    'better-t-stack', 'monorepo', 'turbo', 'turborepo', 'pnpm',
  ],
  'e2e-test-engineer': [
    'test', 'testing', 'e2e', 'end-to-end', 'playwright', 'cypress',
    'vitest', 'jest', 'spec', 'assertion', 'integration test',
    'component test', 'screenshot', 'visual regression',
  ],
  'database-architect': [
    'database', 'db', 'schema', 'migration', 'drizzle', 'sql', 'sqlite',
    'postgres', 'postgresql', 'mysql', 'orm', 'query', 'index',
    'foreign key', 'relation', 'constraint', 'trigger', 'view',
  ],
  'ux-design-specialist': [
    'ui', 'ux', 'design', 'component', 'layout', 'responsive',
    'accessibility', 'a11y', 'figma', 'design system', 'shadcn',
    'tailwind', 'css', 'styling', 'theme', 'brand', 'animation',
  ],
  'ui-animation-specialist': [
    'animation', 'framer motion', 'transition', 'animate', 'motion',
    'spring', 'gesture', 'interactive', 'micro-interaction', 'keyframe',
    'fade', 'slide', 'scale', 'rotate', 'parallax',
  ],
  'docker-network-architect': [
    'docker', 'container', 'compose', 'dockerfile', 'network',
    'volume', 'orchestration', 'kubernetes', 'k8s', 'deployment',
    'registry', 'image', 'pod', 'service mesh', 'homelab',
  ],
  'redis-cache-architect': [
    'cache', 'caching', 'redis', 'upstash', 'memcached', 'session',
    'rate limit', 'rate limiting', 'performance', 'optimization',
    'ttl', 'expiration', 'invalidation', 'distributed cache',
  ],
  'azure-bicep-architect': [
    'azure', 'bicep', 'arm template', 'cloud', 'infrastructure',
    'iac', 'infrastructure as code', 'resource group', 'deployment',
    'azure resource', 'azure service', 'azure function',
  ],
  'accessible-ui-designer': [
    'accessibility', 'a11y', 'wcag', 'aria', 'screen reader',
    'keyboard navigation', 'focus management', 'semantic html',
    'inclusive design', 'contrast', 'alt text',
  ],
  'trpc-backend-engineer': [
    'trpc', 'backend', 'api', 'server', 'endpoint', 'procedure',
    'middleware', 'authentication', 'authorization', 'context',
    'router', 'mutation', 'query', 'subscription',
  ],
  'nextjs-frontend-specialist': [
    'next.js', 'nextjs', 'frontend', 'react', 'client component',
    'server component', 'app router', 'pages router', 'route',
    'ssg', 'ssr', 'isr', 'static generation', 'server-side rendering',
  ],
  'csharp-infrastructure-consultant': [
    'c#', 'csharp', 'dotnet', '.net', 'asp.net', 'infrastructure',
    'architecture', 'migration', 'modernization', 'dependency',
  ],
  'sdlc-manager': [
    'jira', 'sprint', 'task', 'project management', 'agile',
    'scrum', 'kanban', 'workflow', 'coordination', 'delivery',
  ],
  'general-purpose': [],
};

/**
 * Service for selecting the best agent type for a given spec
 */
export class WorkerSelectorService {
  /**
   * Select the most appropriate agent type for a spec
   * @param spec Spec data with proposal, tasks, design content
   * @returns Agent selection result with reasoning
   */
  selectAgentType(spec: {
    proposalContent?: string | null;
    tasksContent?: string | null;
    designContent?: string | null;
  }): AgentSelectionResult {
    // Combine all content
    const allContent = [
      spec.proposalContent ?? '',
      spec.tasksContent ?? '',
      spec.designContent ?? '',
    ]
      .join('\n')
      .toLowerCase();

    if (!allContent.trim()) {
      return {
        agentType: 'general-purpose',
        confidence: 'low',
        reasoning: 'No spec content available, using fallback',
        keywords: [],
      };
    }

    // Score each agent type
    const scores: Array<{
      agentType: AgentType;
      score: number;
      matchedKeywords: string[];
    }> = [];

    for (const [agentType, keywords] of Object.entries(AGENT_KEYWORDS)) {
      if (agentType === 'general-purpose') continue;

      const matchedKeywords = keywords.filter(keyword =>
        allContent.includes(keyword.toLowerCase())
      );

      const score = matchedKeywords.length;
      if (score > 0) {
        scores.push({
          agentType: agentType as AgentType,
          score,
          matchedKeywords,
        });
      }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // No matches - use general-purpose
    if (scores.length === 0) {
      return {
        agentType: 'general-purpose',
        confidence: 'low',
        reasoning: 'No specific technology keywords found',
        keywords: [],
      };
    }

    // Get best match
    const best = scores[0];

    // Determine confidence based on score
    let confidence: 'high' | 'medium' | 'low';
    if (best.score >= 5) {
      confidence = 'high';
    } else if (best.score >= 3) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    // Check for ties (within 1 point of best)
    const ties = scores.filter(s => s.score >= best.score - 1 && s.agentType !== best.agentType);
    const hasTie = ties.length > 0;

    const reasoning = hasTie
      ? `Selected ${best.agentType} with ${best.score} keyword matches (${best.matchedKeywords.join(', ')}). Close alternatives: ${ties.map(t => t.agentType).join(', ')}`
      : `Selected ${best.agentType} with ${best.score} keyword matches (${best.matchedKeywords.join(', ')})`;

    return {
      agentType: best.agentType,
      confidence,
      reasoning,
      keywords: best.matchedKeywords,
    };
  }

  /**
   * Get all keywords for a specific agent type
   */
  getKeywordsForAgent(agentType: AgentType): string[] {
    return AGENT_KEYWORDS[agentType] ?? [];
  }

  /**
   * Test keyword matching (useful for debugging)
   */
  testKeywordMatch(content: string, agentType: AgentType): string[] {
    const keywords = AGENT_KEYWORDS[agentType] ?? [];
    const lowerContent = content.toLowerCase();
    return keywords.filter(keyword => lowerContent.includes(keyword.toLowerCase()));
  }
}
