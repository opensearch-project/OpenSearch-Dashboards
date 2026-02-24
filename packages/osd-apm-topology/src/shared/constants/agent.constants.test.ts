/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AGENT_NODE_KINDS } from './agent.constants';

const ALL_KINDS = ['agent', 'llm', 'tool', 'retriever', 'embeddings', 'other'] as const;

describe('AGENT_NODE_KINDS', () => {
  it('has entries for all 6 kinds', () => {
    ALL_KINDS.forEach((kind) => {
      expect(AGENT_NODE_KINDS[kind]).toBeDefined();
    });
  });

  it('each entry has label, color, and icon fields', () => {
    ALL_KINDS.forEach((kind) => {
      const config = AGENT_NODE_KINDS[kind];
      expect(config.label).toBeDefined();
      expect(config.color).toBeDefined();
      expect(config.icon).toBeDefined();
    });
  });

  it('colors are CSS variable strings', () => {
    ALL_KINDS.forEach((kind) => {
      expect(AGENT_NODE_KINDS[kind].color).toContain('var(');
    });
  });

  it('labels match expected values', () => {
    expect(AGENT_NODE_KINDS.agent.label).toBe('Agent');
    expect(AGENT_NODE_KINDS.llm.label).toBe('LLM');
    expect(AGENT_NODE_KINDS.tool.label).toBe('Tool');
    expect(AGENT_NODE_KINDS.retriever.label).toBe('Retriever');
    expect(AGENT_NODE_KINDS.embeddings.label).toBe('Embeddings');
    expect(AGENT_NODE_KINDS.other.label).toBe('Other');
  });

  it('tool kind has textColor', () => {
    expect(AGENT_NODE_KINDS.tool.textColor).toBe('#1A1A1A');
  });

  it('other kinds do not have textColor', () => {
    expect(AGENT_NODE_KINDS.agent.textColor).toBeUndefined();
    expect(AGENT_NODE_KINDS.llm.textColor).toBeUndefined();
    expect(AGENT_NODE_KINDS.retriever.textColor).toBeUndefined();
    expect(AGENT_NODE_KINDS.embeddings.textColor).toBeUndefined();
    expect(AGENT_NODE_KINDS.other.textColor).toBeUndefined();
  });
});
