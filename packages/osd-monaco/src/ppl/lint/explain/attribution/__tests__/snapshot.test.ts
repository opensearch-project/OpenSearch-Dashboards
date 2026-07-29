/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { CharStream, CommonTokenStream } from 'antlr4ng';
import { createCompiledRuleNameToIndex } from '../../../rule_index';
import { buildExplainAttributionSnapshot } from '../candidates';
import {
  EXPLAIN_ATTRIBUTION_SNAPSHOT_VERSION,
  validateExplainAttributionSnapshot,
} from '../snapshot';

function snapshot(query: string) {
  const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(query));
  const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
  return buildExplainAttributionSnapshot(parser.root(), createCompiledRuleNameToIndex(), query);
}

describe('Explain attribution snapshot', () => {
  it('is structured-clone-safe plain data and validates against its source', () => {
    const query = 'source=logs | where bytes - 10 > 20 | sort bytes';
    const value = snapshot(query);
    const clone = structuredClone(value);

    expect(clone).toEqual(value);
    expect(validateExplainAttributionSnapshot(clone, query)).toEqual(value);

    const visit = (entry: unknown): void => {
      if (entry === null || typeof entry !== 'object') {
        expect(typeof entry).not.toBe('function');
        return;
      }
      expect(entry).not.toBeInstanceOf(Map);
      expect(entry).not.toBeInstanceOf(Set);
      expect([Object.prototype, Array.prototype]).toContain(Object.getPrototypeOf(entry));
      Object.values(entry).forEach(visit);
    };
    visit(value);
  });

  it('rejects protocol, source, duplicate-id, and offset corruption', () => {
    const query = 'source=logs | where bytes > 1';
    const value = snapshot(query);

    expect(
      validateExplainAttributionSnapshot({ ...value, protocolVersion: 2 }, query)
    ).toBeUndefined();
    expect(validateExplainAttributionSnapshot(value, `${query} `)).toBeUndefined();
    expect(
      validateExplainAttributionSnapshot(
        { ...value, candidates: [...value.candidates, value.candidates[0]] },
        query
      )
    ).toBeUndefined();
    expect(
      validateExplainAttributionSnapshot(
        {
          ...value,
          protocolVersion: EXPLAIN_ATTRIBUTION_SNAPSHOT_VERSION,
          candidates: [{ ...value.candidates[0], endOffset: query.length + 1 }],
        },
        query
      )
    ).toBeUndefined();
  });
});
