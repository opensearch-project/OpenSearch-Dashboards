/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import { createRuntimeRuleNameToIndex } from '../../../rule_index';
import { buildExplainAttributionSnapshot } from '../candidates';
import { buildExplainProbeSet } from '../probes';

const ruleNameToIndex = createRuntimeRuleNameToIndex(
  new Map(SimplifiedOpenSearchPPLParser.ruleNames.map((name, ruleIndex) => [name, ruleIndex]))
);

function buildTree(query: string): ParserRuleContext {
  const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(query));
  lexer.removeErrorListeners();
  const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
  parser.removeErrorListeners();
  return parser.root();
}

function index(query: string, typeMap?: Map<string, string>) {
  return buildExplainAttributionSnapshot(buildTree(query), ruleNameToIndex, query, { typeMap });
}

function normalized(query: string): string {
  return query.replace(/\s+/g, ' ').trim();
}

describe('explain attribution candidates', () => {
  it('returns repeated filters in source order with distinct exact ranges', () => {
    const query = 'source=logs | where bytes - 1 > 2 | where bytes - 1 > 2 | where status = 200';
    const filters = index(query).candidates.filter(({ operation }) => operation === 'filter');

    expect(filters.map(({ sourceText }) => sourceText)).toEqual([
      'bytes - 1 > 2',
      'bytes - 1 > 2',
      'status = 200',
    ]);
    expect(filters.map(({ startOffset }) => startOffset)).toEqual(
      [...filters.map(({ startOffset }) => startOffset)].sort((a, b) => a - b)
    );
    expect(new Set(filters.map(({ id }) => id)).size).toBe(3);
  });

  it('normalizes supplementary Unicode and multiline CRLF ranges to UTF-16', () => {
    const query = 'source=logs | eval label = "😀"\r\n| where (\r\n\tbytes - 1000 > 5000\r\n)';
    const [filter] = index(query).candidates.filter(({ operation }) => operation === 'filter');

    expect(filter.sourceText).toBe('(\r\n\tbytes - 1000 > 5000\r\n)');
    expect(query.slice(filter.startOffset, filter.endOffset)).toBe(filter.sourceText);
    expect(filter.focusRange.startLine).toBe(2);
    expect(filter.focusRange.endLine).toBe(4);
  });

  it('extracts every aggregate term and sort key, retaining a simple eval binding', () => {
    const statsQuery = 'source=logs | stats values(status), count() by host';
    const aggregates = index(statsQuery).candidates.filter(
      ({ operation }) => operation === 'aggregation'
    );
    expect(aggregates.map(({ sourceText }) => sourceText)).toEqual(['values(status)', 'count()']);

    const sortQuery = 'source=logs | eval x = bytes + latency | sort bytes, x | head 10';
    const sorts = index(
      sortQuery,
      new Map([
        ['bytes', 'long'],
        ['latency', 'integer'],
      ])
    ).candidates.filter(({ operation }) => operation === 'sort');
    expect(sorts.map(({ sourceText }) => sourceText)).toEqual(['bytes', 'x']);
    expect(sorts[0].aliasBinding).toBeUndefined();
    expect(sorts[1].aliasBinding?.alias).toBe('x');
    expect(
      sortQuery.slice(sorts[1].relatedRange!.startColumn, sorts[1].relatedRange!.endColumn)
    ).toBe('x');
    expect(
      sortQuery.slice(
        sorts[1].aliasBinding!.definitionStartOffset,
        sorts[1].aliasBinding!.definitionEndOffset
      )
    ).toBe('bytes + latency');
  });

  it('tracks an exact related use range for a derived filter alias', () => {
    const query = 'source=logs | eval x = bytes + latency | where x > 5000';
    const [filter] = index(
      query,
      new Map([
        ['bytes', 'long'],
        ['latency', 'integer'],
      ])
    ).candidates.filter(({ operation }) => operation === 'filter');

    expect(filter.aliasBinding?.alias).toBe('x');
    expect(query.slice(filter.relatedRange!.startColumn, filter.relatedRange!.endColumn)).toBe('x');
  });

  it('propagates a simple rename and drops a shadowed eval binding', () => {
    const typeMap = new Map([
      ['bytes', 'long'],
      ['latency', 'integer'],
      ['status', 'keyword'],
    ]);
    const renamedQuery =
      'source=logs | eval x = bytes + latency | rename x as derived | sort derived';
    const [renamedSort] = index(renamedQuery, typeMap).candidates.filter(
      ({ operation }) => operation === 'sort'
    );
    expect(renamedSort.aliasBinding?.alias).toBe('derived');
    expect(
      renamedQuery.slice(
        renamedSort.aliasBinding!.definitionStartOffset,
        renamedSort.aliasBinding!.definitionEndOffset
      )
    ).toBe('bytes + latency');

    const shadowedQuery = 'source=logs | eval x = bytes + latency | rename status as x | sort x';
    const [shadowedSort] = index(shadowedQuery, typeMap).candidates.filter(
      ({ operation }) => operation === 'sort'
    );
    expect(shadowedSort.aliasBinding).toBeUndefined();
  });

  it('drops eval bindings across unsupported field-producing stages', () => {
    const query = 'source=logs | eval x = bytes + latency | parse message "(?<x>.*)" | sort x';
    const [sort] = index(
      query,
      new Map([
        ['bytes', 'long'],
        ['latency', 'integer'],
      ])
    ).candidates.filter(({ operation }) => operation === 'sort');

    expect(sort.aliasBinding).toBeUndefined();
  });

  it('marks independent subsearch scopes unsupported on the runtime grammar', () => {
    const query =
      'source=accounts | where balance > [ source=other | where age > 1 | stats max(age) ]';
    const result = index(query);
    expect(result.unsupportedOperations).toEqual(['filter', 'aggregation', 'sort']);
  });

  it('serializes the single filter comparison span without parser nodes', () => {
    const query = 'source=logs | where NOT bytes - 2 > 30';
    const [filter] = index(query).candidates.filter(({ operation }) => operation === 'filter');

    expect(
      query.slice(filter.filterComparison!.startOffset, filter.filterComparison!.endOffset)
    ).toBe('bytes - 2 > 30');
    expect('focusNode' in filter).toBe(false);
    expect('stageNode' in filter).toBe(false);
  });
});

describe('explain probe construction', () => {
  it('neutralizes all filters and restores exactly one source predicate', () => {
    const query = 'source=logs | where bytes > 1 | where bytes - 1000 > 5000';
    const candidates = index(query).candidates.filter(({ operation }) => operation === 'filter');
    const probes = buildExplainProbeSet(query, candidates)!;

    expect(normalized(probes.controlQuery)).toBe('source=logs | where true | where true');
    expect(probes.treatments.map(({ query: treatment }) => normalized(treatment))).toEqual([
      'source=logs | where bytes > 1 | where true',
      'source=logs | where true | where bytes - 1000 > 5000',
    ]);
  });

  it('reduces stats to one term and ends each treatment at the stats command', () => {
    const query = 'source=logs | where status > 0 | stats values(status), count() by host | head 5';
    const candidates = index(query).candidates.filter(
      ({ operation }) => operation === 'aggregation'
    );
    const probes = buildExplainProbeSet(query, candidates)!;

    expect(normalized(probes.controlQuery)).toBe('source=logs | where status > 0');
    expect(probes.treatments.map(({ query: treatment }) => normalized(treatment))).toEqual([
      'source=logs | where status > 0 | stats values(status) by host',
      'source=logs | where status > 0 | stats count() by host',
    ]);
  });

  it('removes or reduces sort without treating a pipe inside a string as a stage', () => {
    const query =
      'source=logs | where message = "left|right" | eval x = bytes + latency | sort bytes, x | head 10';
    const candidates = index(query).candidates.filter(({ operation }) => operation === 'sort');
    const probes = buildExplainProbeSet(query, candidates)!;

    expect(normalized(probes.controlQuery)).toBe(
      'source=logs | where message = "left|right" | eval x = bytes + latency | head 10'
    );
    expect(probes.treatments.map(({ query: treatment }) => normalized(treatment))).toEqual([
      'source=logs | where message = "left|right" | eval x = bytes + latency | sort bytes | head 10',
      'source=logs | where message = "left|right" | eval x = bytes + latency | sort x | head 10',
    ]);
  });
});
