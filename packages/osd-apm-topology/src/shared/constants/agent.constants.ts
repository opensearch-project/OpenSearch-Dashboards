/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentNodeKind } from '../types/agent.types';

export interface AgentNodeKindConfig {
  label: string;
  color: string;
  /** Text color for TypeBadge. Dark text for light backgrounds (e.g., amber). */
  textColor?: string;
}

export const AGENT_NODE_KINDS: Record<AgentNodeKind, AgentNodeKindConfig> = {
  agent: {
    label: 'Agent',
    color: 'var(--osd-color-type-agent, #54B399)',
  },
  llm: {
    label: 'LLM',
    color: 'var(--osd-color-type-llm, #DD0A73)',
  },
  tool: {
    label: 'Tool',
    color: 'var(--osd-color-type-tool, #E7664C)',
  },
  retrieval: {
    label: 'Retrieval',
    color: 'var(--osd-color-type-retrieval, #B9A888)',
  },
  embeddings: {
    label: 'Embeddings',
    color: 'var(--osd-color-type-embeddings, #6092C0)',
  },
  content: {
    label: 'Content',
    color: 'var(--osd-color-type-content, #D6BF57)',
  },
  other: {
    label: 'Other',
    color: 'var(--osd-color-type-other, #98A2B3)',
  },
};
