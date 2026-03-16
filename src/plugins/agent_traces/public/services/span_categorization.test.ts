/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

jest.mock('@osd/ui-shared-deps/theme', () => ({
  euiThemeVars: {
    euiColorVis0: '#54B399',
    euiColorVis1: '#6092C0',
    euiColorVis2: '#D36086',
    euiColorVis3: '#9170B8',
    euiColorVis4: '#CA8EAE',
    euiColorVis5: '#D6BF57',
    euiColorVis6: '#B9A888',
    euiColorVis7: '#DA8B45',
    euiColorVis8: '#AA6556',
    euiColorMediumShade: '#98A2B3',
    euiColorPrimary: '#006BB4',
    euiColorDarkShade: '#69707D',
  },
}));

import {
  getCategoryMeta,
  getSpanCategory,
  hexToRgba,
  categorizeSpanTree,
  SpanCategory,
} from './span_categorization';

describe('span_categorization', () => {
  describe('getSpanCategory', () => {
    it.each([
      ['chat', 'LLM'],
      ['text_completion', 'LLM'],
      ['generate_content', 'LLM'],
      ['embeddings', 'EMBEDDINGS'],
      ['execute_tool', 'TOOL'],
      ['retrieval', 'RETRIEVAL'],
      ['invoke_agent', 'AGENT'],
      ['create_agent', 'AGENT'],
    ] as Array<[string, SpanCategory]>)('maps "%s" to %s', (kind, expected) => {
      expect(getSpanCategory({ kind })).toBe(expected);
    });

    it('returns OTHER for unknown operation names', () => {
      expect(getSpanCategory({ kind: 'unknown_op' })).toBe('OTHER');
    });

    it('returns OTHER when kind is undefined', () => {
      expect(getSpanCategory({})).toBe('OTHER');
    });

    it('is case-insensitive', () => {
      expect(getSpanCategory({ kind: 'Chat' })).toBe('LLM');
      expect(getSpanCategory({ kind: 'EMBEDDINGS' })).toBe('EMBEDDINGS');
    });
  });

  describe('getCategoryMeta', () => {
    it('returns color, bgColor, textColor, and label for each category', () => {
      const categories: SpanCategory[] = [
        'AGENT',
        'LLM',
        'TOOL',
        'EMBEDDINGS',
        'RETRIEVAL',
        'OTHER',
      ];
      for (const cat of categories) {
        const meta = getCategoryMeta(cat);
        expect(meta).toHaveProperty('color');
        expect(meta).toHaveProperty('bgColor');
        expect(meta).toHaveProperty('textColor');
        expect(meta).toHaveProperty('label');
        expect(meta.textColor).toBe(meta.color);
        expect(meta.bgColor).toBe(hexToRgba(meta.color, 0.12));
      }
    });

    it('does not include icon property', () => {
      const meta = getCategoryMeta('AGENT');
      expect(meta).not.toHaveProperty('icon');
    });

    it('returns correct labels', () => {
      expect(getCategoryMeta('AGENT').label).toBe('Agent');
      expect(getCategoryMeta('LLM').label).toBe('LLM');
      expect(getCategoryMeta('TOOL').label).toBe('Tool');
      expect(getCategoryMeta('EMBEDDINGS').label).toBe('Embeddings');
      expect(getCategoryMeta('RETRIEVAL').label).toBe('Retrieval');
      expect(getCategoryMeta('OTHER').label).toBe('Other');
    });
  });

  describe('hexToRgba', () => {
    it('converts hex to rgba', () => {
      expect(hexToRgba('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('handles full opacity', () => {
      expect(hexToRgba('#00FF00', 1)).toBe('rgba(0, 255, 0, 1)');
    });

    it('handles zero opacity', () => {
      expect(hexToRgba('#0000FF', 0)).toBe('rgba(0, 0, 255, 0)');
    });
  });

  describe('categorizeSpanTree', () => {
    const makeSpan = (overrides: Record<string, any> = {}) => ({
      id: 'span-1',
      spanId: 'span-1',
      traceId: 'trace-1',
      parentSpanId: null,
      status: 'success',
      kind: 'chat',
      name: 'Test Span',
      input: '',
      output: '',
      startTime: '',
      endTime: '',
      latency: '100ms',
      totalTokens: 0,
      totalCost: '—',
      ...overrides,
    });

    it('categorizes spans with correct category', () => {
      const spans = [
        makeSpan({ kind: 'chat' }),
        makeSpan({ kind: 'execute_tool', id: 's2', spanId: 's2' }),
      ];
      const result = categorizeSpanTree(spans as any);
      expect(result[0].category).toBe('LLM');
      expect(result[1].category).toBe('TOOL');
    });

    it('sets displayName from span name', () => {
      const result = categorizeSpanTree([makeSpan({ name: 'my-agent' })] as any);
      expect(result[0].displayName).toBe('my-agent');
    });

    it('truncates long display names to 40 chars', () => {
      const longName = 'a'.repeat(50);
      const result = categorizeSpanTree([makeSpan({ name: longName })] as any);
      expect(result[0].displayName).toBe('a'.repeat(37) + '...');
    });

    it('does not include categoryIcon property', () => {
      const result = categorizeSpanTree([makeSpan()] as any);
      expect(result[0]).not.toHaveProperty('categoryIcon');
    });

    it('recursively categorizes children', () => {
      const parent = makeSpan({
        kind: 'invoke_agent',
        children: [makeSpan({ kind: 'chat', id: 'child-1', spanId: 'child-1' })],
      });
      const result = categorizeSpanTree([parent] as any);
      expect(result[0].category).toBe('AGENT');
      expect((result[0].children![0] as any).category).toBe('LLM');
    });

    it('uses "Unknown" as display name when name is empty', () => {
      const result = categorizeSpanTree([makeSpan({ name: '' })] as any);
      expect(result[0].displayName).toBe('Unknown');
    });
  });
});
