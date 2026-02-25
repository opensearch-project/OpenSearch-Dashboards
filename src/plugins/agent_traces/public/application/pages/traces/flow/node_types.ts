/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NodeTypes } from '@xyflow/react';
import { SpanNode } from './span_node';

// Keys must match span.category.toLowerCase()
export const nodeTypes: NodeTypes = {
  agent: SpanNode,
  llm: SpanNode,
  tool: SpanNode,
  content: SpanNode,
  embeddings: SpanNode,
  retrieval: SpanNode,
  error: SpanNode,
  other: SpanNode,
};
