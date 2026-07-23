/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as antlr from 'antlr4ng';
import {
  SimplifiedOpenSearchPPLLexer as OpenSearchPPLLexer,
  SimplifiedOpenSearchPPLParser as OpenSearchPPLParser,
} from '@osd/antlr-grammar';
import {
  classifyTopLevelSource,
  isPipeFirstQuery,
  sourceConflictsWithDataset,
  TopLevelSource,
} from './top_level_source';
import { createCompiledRuleNameToIndex } from './rule_index';
import { PIPE_FIRST_PREFIX } from './range_utils';

const ruleNameToIndex = createCompiledRuleNameToIndex();

/** Parse a query to a tree the way the analyzer does, honoring pipe-first. */
function parse(query: string) {
  const effective = query.trimStart().startsWith('|') ? PIPE_FIRST_PREFIX + query : query;
  const stream = antlr.CharStream.fromString(effective);
  const lexer = new OpenSearchPPLLexer(stream);
  const parser = new OpenSearchPPLParser(new antlr.CommonTokenStream(lexer));
  parser.removeErrorListeners();
  return parser.root();
}

describe('isPipeFirstQuery', () => {
  it('is true only when the first non-space char is a pipe', () => {
    expect(isPipeFirstQuery('| where a > 1')).toBe(true);
    expect(isPipeFirstQuery('   | stats count()')).toBe(true);
    expect(isPipeFirstQuery('source=logs | head 5')).toBe(false);
    expect(isPipeFirstQuery('')).toBe(false);
  });
});

describe('classifyTopLevelSource', () => {
  it('classifies a single concrete source', () => {
    const result = classifyTopLevelSource(
      parse('source=logs | head 5'),
      ruleNameToIndex,
      isPipeFirstQuery('source=logs | head 5')
    );
    expect(result.kind).toBe('single-table');
    if (result.kind === 'single-table') {
      expect(result.value).toBe('logs');
    }
  });

  it('reports a wildcard source verbatim as single-table', () => {
    const q = 'source=logs-* | head 5';
    const result = classifyTopLevelSource(parse(q), ruleNameToIndex, isPipeFirstQuery(q));
    expect(result.kind).toBe('single-table');
    if (result.kind === 'single-table') {
      expect(result.value).toBe('logs-*');
    }
  });

  it('classifies a pipe-first query with no leading source', () => {
    // A pipe-first query gets the synthetic prefix to parse; the classifier must
    // still report pipe-first from the ORIGINAL query text, not the rewritten one.
    const q = '| where status = 200';
    const result = classifyTopLevelSource(parse(q), ruleNameToIndex, isPipeFirstQuery(q));
    expect(result.kind).toBe('pipe-first');
  });

  it('is inconclusive for a query with more than one top-level source', () => {
    // Two comma-separated sources parse as two source comparisons on this
    // surface; the classifier must not pick one arbitrarily.
    const q = 'source=a, b | head 5';
    const result = classifyTopLevelSource(parse(q), ruleNameToIndex, isPipeFirstQuery(q));
    expect(result.kind).toBe('inconclusive');
  });

  it('is inconclusive when no source is present and the query is not pipe-first', () => {
    const q = 'head 5';
    const result = classifyTopLevelSource(parse(q), ruleNameToIndex, isPipeFirstQuery(q));
    expect(result.kind).toBe('inconclusive');
  });
});

describe('sourceConflictsWithDataset', () => {
  const single = (value: string): TopLevelSource => ({
    kind: 'single-table',
    value,
    range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
  });

  it('is true when a plain single source differs from the selected pattern', () => {
    expect(sourceConflictsWithDataset(single('returns'), 'orders')).toBe(true);
  });

  it('is false when the single source matches the selected pattern', () => {
    expect(sourceConflictsWithDataset(single('orders'), 'orders')).toBe(false);
  });

  it('matches after quote/dot normalization', () => {
    expect(sourceConflictsWithDataset(single('`orders`'), 'orders')).toBe(false);
  });

  it('fails open when there is no selected pattern', () => {
    expect(sourceConflictsWithDataset(single('returns'), undefined)).toBe(false);
    expect(sourceConflictsWithDataset(single('returns'), '')).toBe(false);
  });

  it('fails open for a wildcard on either side', () => {
    expect(sourceConflictsWithDataset(single('logs-2024'), 'logs-*')).toBe(false);
    expect(sourceConflictsWithDataset(single('logs-*'), 'logs-2024')).toBe(false);
  });

  it('fails open for pipe-first and inconclusive classifications', () => {
    const pipeFirst: TopLevelSource = {
      kind: 'pipe-first',
      range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
    };
    expect(sourceConflictsWithDataset(pipeFirst, 'orders')).toBe(false);
    expect(sourceConflictsWithDataset({ kind: 'inconclusive' }, 'orders')).toBe(false);
  });
});
