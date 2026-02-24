/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentNodeKind } from '../types/agent.types';
import {
  AgentIcon,
  LlmIcon,
  ToolIcon,
  RetrieverIcon,
  EmbeddingsIcon,
  OtherIcon,
} from '../resources/agents';

export interface AgentNodeKindConfig {
  label: string;
  color: string;
  /** SVG icon URL for the node kind */
  icon: string;
  /** Text color for TypeBadge. Dark text for light backgrounds (e.g., amber). */
  textColor?: string;
}

export const AGENT_NODE_KINDS: Record<AgentNodeKind, AgentNodeKindConfig> = {
  agent: {
    label: 'Agent',
    color: 'var(--osd-color-type-agent, #006BB4)',
    icon: AgentIcon,
  },
  llm: {
    label: 'LLM',
    color: 'var(--osd-color-type-llm, #DD0A73)',
    icon: LlmIcon,
  },
  tool: {
    label: 'Tool',
    color: 'var(--osd-color-type-tool, #F5A700)',
    icon: ToolIcon,
    textColor: '#1A1A1A',
  },
  retriever: {
    label: 'Retriever',
    color: 'var(--osd-color-type-retriever, #54B399)',
    icon: RetrieverIcon,
  },
  embeddings: {
    label: 'Embeddings',
    color: 'var(--osd-color-type-embeddings, #6092C0)',
    icon: EmbeddingsIcon,
  },
  other: {
    label: 'Other',
    color: 'var(--osd-color-type-other, #98A2B3)',
    icon: OtherIcon,
  },
};
