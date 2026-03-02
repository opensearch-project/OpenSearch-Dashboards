/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { nodeTypes } from './node_types';

jest.mock('./span_node', () => ({
  SpanNode: 'MockSpanNode',
}));

describe('nodeTypes', () => {
  it('maps all categories to SpanNode', () => {
    expect(nodeTypes.agent).toBe('MockSpanNode');
    expect(nodeTypes.llm).toBe('MockSpanNode');
    expect(nodeTypes.tool).toBe('MockSpanNode');
    expect(nodeTypes.content).toBe('MockSpanNode');
    expect(nodeTypes.embeddings).toBe('MockSpanNode');
    expect(nodeTypes.retrieval).toBe('MockSpanNode');
    expect(nodeTypes.other).toBe('MockSpanNode');
  });
});
