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
  ContentIcon,
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
    color: 'var(--osd-color-type-agent, #0D70CA)',
    icon: AgentIcon,
  },
  llm: {
    label: 'LLM',
    color: 'var(--osd-color-type-llm, #D74987)',
    icon: LlmIcon,
  },
  tool: {
    label: 'Tool',
    color: 'var(--osd-color-type-tool, #D6BF57)',
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
  content: {
    label: 'Content',
    color: 'var(--osd-color-type-content, #9170B8)',
    icon: ContentIcon,
  },
  other: {
    label: 'Other',
    color: 'var(--osd-color-type-other, #9C9DA0)',
    icon: OtherIcon,
  },
};
