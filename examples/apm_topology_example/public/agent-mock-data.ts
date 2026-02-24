/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentNodeData } from '@osd/apm-topology';

interface AgentMockNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: AgentNodeData;
}

interface AgentMockEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    style?: {
      dashed?: boolean;
      animated?: boolean;
      color?: string;
      label?: string;
      marker?: 'arrow' | 'arrowClosed' | 'none';
      type?: 'solid' | 'dashed' | 'dotted';
      animationType?: 'none' | 'flow' | 'pulse';
      strokeWidth?: number;
    };
  };
}

export const agentTraceNodes: AgentMockNode[] = [
  {
    id: 'a1',
    type: 'agentCard',
    position: { x: 0, y: 0 },
    data: {
      id: 'a1',
      nodeKind: 'agent',
      title: 'agent.run',
      duration: 14660,
      latency: '14.66s',
      status: 'warning',
      statusLabel: 'Slow',
    },
  },
  {
    id: 'a2',
    type: 'agentCard',
    position: { x: 0, y: 0 },
    data: {
      id: 'a2',
      nodeKind: 'llm',
      title: 'ChatCompletion',
      subtitle: 'claude-3-opus',
      duration: 5200,
      latency: '5.2s',
      status: 'ok',
      model: 'claude-3-opus',
      provider: 'anthropic',
      metrics: [
        { label: 'Duration', value: 5200, max: 14660, formattedValue: '5.2s' },
        { label: 'Tokens', value: 1200, max: 4096, color: '#A855F7', formattedValue: '1.2k' },
      ],
    },
  },
  {
    id: 'a3',
    type: 'agentCard',
    position: { x: 0, y: 0 },
    data: {
      id: 'a3',
      nodeKind: 'tool',
      title: 'ListIndexTool',
      duration: 868,
      latency: '868ms',
      status: 'ok',
    },
  },
  {
    id: 'a4',
    type: 'agentCard',
    position: { x: 0, y: 0 },
    data: {
      id: 'a4',
      nodeKind: 'tool',
      title: 'SearchTool',
      duration: 2340,
      latency: '2.34s',
      status: 'ok',
    },
  },
  {
    id: 'a5',
    type: 'agentCard',
    position: { x: 0, y: 0 },
    data: {
      id: 'a5',
      nodeKind: 'llm',
      title: 'ChatCompletion',
      subtitle: 'gpt-4o',
      duration: 1990,
      latency: '1.99s',
      status: 'ok',
      model: 'gpt-4o',
      provider: 'openai',
    },
  },
  {
    id: 'a6',
    type: 'agentCard',
    position: { x: 0, y: 0 },
    data: {
      id: 'a6',
      nodeKind: 'retriever',
      title: 'VectorStoreRetriever',
      duration: 450,
      latency: '450ms',
      status: 'ok',
    },
  },
  {
    id: 'a7',
    type: 'agentCard',
    position: { x: 0, y: 0 },
    data: {
      id: 'a7',
      nodeKind: 'embeddings',
      title: 'text-embedding-3-small',
      duration: 120,
      latency: '120ms',
      status: 'ok',
      model: 'text-embedding-3-small',
      provider: 'openai',
    },
  },
  {
    id: 'a8',
    type: 'agentCard',
    position: { x: 0, y: 0 },
    data: {
      id: 'a8',
      nodeKind: 'other',
      title: 'PostProcessor',
      duration: 35,
      latency: '35ms',
      status: 'ok',
    },
  },
];

export const agentTraceEdges: AgentMockEdge[] = [
  {
    id: 'ae1',
    source: 'a1',
    target: 'a2',
    type: 'celestialEdge',
    data: { style: { type: 'dashed', label: 'invoke', animationType: 'flow' } },
  },
  { id: 'ae2', source: 'a2', target: 'a3', type: 'celestialEdge' },
  { id: 'ae3', source: 'a2', target: 'a4', type: 'celestialEdge' },
  {
    id: 'ae4',
    source: 'a1',
    target: 'a5',
    type: 'celestialEdge',
    data: { style: { type: 'dashed', label: 'invoke', animationType: 'pulse' } },
  },
  { id: 'ae5', source: 'a5', target: 'a6', type: 'celestialEdge' },
  {
    id: 'ae6',
    source: 'a6',
    target: 'a7',
    type: 'celestialEdge',
    data: { style: { type: 'dotted', label: 'embed', marker: 'arrow' } },
  },
  {
    id: 'ae7',
    source: 'a1',
    target: 'a8',
    type: 'celestialEdge',
    data: { style: { marker: 'none', color: '#98A2B3', strokeWidth: 1 } },
  },
];
