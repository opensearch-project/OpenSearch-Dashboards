/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { buildExplainAttributionSnapshot } from '@osd/monaco/target/ppl/lint/explain/attribution/candidates';
import { buildExplainProbeSet } from '@osd/monaco/target/ppl/lint/explain/attribution/probes';
import { createRuntimeRuleNameToIndex } from '@osd/monaco/target/ppl/lint/rule_index';
import { analyzeCompiledPPLLint, validateCompiledPPLLintQueries } from '@osd/monaco';
import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import {
  buildCandidateFixProbeQueries,
  buildPerformanceFixProbeQueries,
} from './performance_fix_revalidation';

jest.mock('@osd/monaco', () => ({
  analyzeCompiledPPLLint: jest.fn(),
  validateCompiledPPLLintQueries: jest.fn(),
}));

const mockAnalyze = analyzeCompiledPPLLint as jest.Mock;
const mockValidateQueries = validateCompiledPPLLintQueries as jest.Mock;

const ruleNameToIndex = createRuntimeRuleNameToIndex(
  new Map(SimplifiedOpenSearchPPLParser.ruleNames.map((name, index) => [name, index]))
);
const typeMap = new Map([
  ['bytes', 'long'],
  ['latency', 'integer'],
  ['status', 'integer'],
]);

function parseTree(query: string): ParserRuleContext {
  const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(query));
  lexer.removeErrorListeners();
  const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
  parser.removeErrorListeners();
  return parser.root();
}

function parseCandidates(query: string) {
  return buildExplainAttributionSnapshot(parseTree(query), ruleNameToIndex, query, { typeMap });
}

function target(query: string, text: string) {
  const startOffset = query.indexOf(text);
  return {
    operation: 'filter' as const,
    targetText: text,
    targetRange: { startOffset, endOffset: startOffset + text.length },
  };
}

describe('buildCandidateFixProbeQueries', () => {
  beforeEach(() => {
    mockAnalyze.mockReset();
    mockValidateQueries.mockReset();
  });
  it('isolates the attributed filter when another scripted filter remains', () => {
    const original = 'source=logs | where bytes - 1000 > 5000 | where latency + 10 > 20';
    const fixed = 'source=logs | where bytes > 6000 | where latency + 10 > 20';

    expect(
      buildCandidateFixProbeQueries(
        original,
        fixed,
        target(original, 'bytes - 1000 > 5000'),
        parseCandidates(original),
        parseCandidates(fixed)
      )
    ).toEqual({
      originalTreatment: 'source=logs | where bytes - 1000 > 5000 | where true',
      fixedTreatment: 'source=logs | where bytes > 6000 | where true',
    });
  });

  it('matches a derived alias by its primary definition range', () => {
    const original =
      'source=logs | eval x = bytes + latency | where x > 5000 | where status + 1 > 2';
    const fixed = 'source=logs | eval x = bytes | where x > 5000 | where status + 1 > 2';
    const originalFilters = parseCandidates(original).candidates.filter(
      ({ operation }) => operation === 'filter'
    );
    const fixedFilters = parseCandidates(fixed).candidates.filter(
      ({ operation }) => operation === 'filter'
    );

    expect(originalFilters.map(({ aliasBinding }) => aliasBinding?.alias)).toEqual([
      'x',
      undefined,
    ]);
    expect(fixedFilters.map(({ aliasBinding }) => aliasBinding?.alias)).toEqual(['x', undefined]);
    const aliasTarget = target(original, 'bytes + latency');
    expect(originalFilters[0].aliasBinding).toEqual(
      expect.objectContaining({
        definitionStartOffset: aliasTarget.targetRange.startOffset,
        definitionEndOffset: aliasTarget.targetRange.endOffset,
      })
    );
    expect(
      buildExplainProbeSet(original, originalFilters)?.buildTreatment(originalFilters[0])
    ).toBe('source=logs | eval x = bytes + latency | where x > 5000 | where true');
    expect(buildExplainProbeSet(fixed, fixedFilters)?.buildTreatment(fixedFilters[0])).toBe(
      'source=logs | eval x = bytes | where x > 5000 | where true'
    );

    expect(
      buildCandidateFixProbeQueries(
        original,
        fixed,
        aliasTarget,
        parseCandidates(original),
        parseCandidates(fixed)
      )
    ).toEqual({
      originalTreatment: 'source=logs | eval x = bytes + latency | where x > 5000 | where true',
      fixedTreatment: 'source=logs | eval x = bytes | where x > 5000 | where true',
    });
  });

  it('rejects a proposal that also changes text outside the attributed range', () => {
    const original = 'source=logs | where bytes - 1000 > 5000 | where latency + 10 > 20';
    const fixed = 'source=other | where bytes > 6000 | where latency + 10 > 20';

    expect(
      buildCandidateFixProbeQueries(
        original,
        fixed,
        target(original, 'bytes - 1000 > 5000'),
        parseCandidates(original),
        parseCandidates(fixed)
      )
    ).toBeUndefined();
  });

  it('builds and batch-validates compiled-worker treatments', async () => {
    const original = 'source=logs | where bytes - 1000 > 5000 | where latency + 10 > 20';
    const fixed = 'source=logs | where bytes > 6000 | where latency + 10 > 20';
    mockAnalyze.mockImplementation(async (query: string) => ({
      result: { diagnostics: [] },
      attribution: parseCandidates(query),
    }));
    mockValidateQueries.mockResolvedValue([true, true]);

    await expect(
      buildPerformanceFixProbeQueries(original, fixed, target(original, 'bytes - 1000 > 5000'), {
        useRuntimeGrammar: false,
        dataSourceVersion: '3.5.0',
        isCalcite: true,
      } as any)
    ).resolves.toEqual({
      originalTreatment: 'source=logs | where bytes - 1000 > 5000 | where true',
      fixedTreatment: 'source=logs | where bytes > 6000 | where true',
    });
    expect(mockAnalyze).toHaveBeenCalledTimes(2);
    expect(mockValidateQueries).toHaveBeenCalledWith([
      'source=logs | where bytes - 1000 > 5000 | where true',
      'source=logs | where bytes > 6000 | where true',
    ]);
  });

  it('rejects the compiled fix before Explain when either treatment is invalid', async () => {
    const original = 'source=logs | where bytes - 1000 > 5000';
    const fixed = 'source=logs | where bytes > 6000';
    mockAnalyze.mockImplementation(async (query: string) => ({
      result: { diagnostics: [] },
      attribution: parseCandidates(query),
    }));
    mockValidateQueries.mockResolvedValue([true, false]);

    await expect(
      buildPerformanceFixProbeQueries(original, fixed, target(original, 'bytes - 1000 > 5000'), {
        useRuntimeGrammar: false,
        dataSourceVersion: '3.5.0',
        isCalcite: true,
      } as any)
    ).resolves.toBeUndefined();
  });

  it('stops before probe validation when the session changes during compiled analysis', async () => {
    const original = 'source=logs | where bytes - 1000 > 5000';
    const fixed = 'source=logs | where bytes > 6000';
    let current = true;
    mockAnalyze.mockImplementation(async (query: string) => {
      if (query === fixed) {
        current = false;
      }
      return {
        result: { diagnostics: [] },
        attribution: parseCandidates(query),
      };
    });

    await expect(
      buildPerformanceFixProbeQueries(
        original,
        fixed,
        target(original, 'bytes - 1000 > 5000'),
        {
          useRuntimeGrammar: false,
          dataSourceVersion: '3.5.0',
          isCalcite: true,
        } as any,
        () => current
      )
    ).resolves.toBeUndefined();
    expect(mockValidateQueries).not.toHaveBeenCalled();
  });
});
