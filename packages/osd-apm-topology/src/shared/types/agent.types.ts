/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BaseNodeData } from '../../types';

/**
 * Node kinds for agent/GenAI topology nodes.
 *
 * Recommended OTel gen_ai.operation.name mapping (consumer responsibility):
 * - `chat`, `text_completion`, `generate_content` → `'llm'`
 * - `create_agent`, `execute_agent`, `invoke_agent` → `'agent'`
 * - `embeddings` → `'embeddings'`
 * - `execute_tool` → `'tool'`
 * - `retrieval` → `'retriever'`
 * - `content`, document/knowledge-base nodes → `'content'`
 * - Unknown operations → `'other'`
 */
export type AgentNodeKind =
  | 'agent'
  | 'llm'
  | 'tool'
  | 'retriever'
  | 'embeddings'
  | 'content'
  | 'other';

export interface AgentNodeData extends BaseNodeData {
  nodeKind: AgentNodeKind;
  duration?: number;
  latency?: string;
  tokens?: { prompt: number; completion: number };
  cost?: number;
  model?: string;
  /** OTel `gen_ai.system` value (e.g., 'openai', 'anthropic', 'aws_bedrock') */
  provider?: string;
  input?: string;
  output?: string;
  /** Multiple metric bars (e.g., duration + token usage). */
  metrics?: Array<{
    label: string;
    value: number;
    max: number;
    color?: string;
    formattedValue?: string;
  }>;
}
