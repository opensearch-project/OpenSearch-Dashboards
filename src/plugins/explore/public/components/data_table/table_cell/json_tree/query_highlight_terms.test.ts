/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractQueryLiterals, mergeHighlightTerms } from './query_highlight_terms';

describe('extractQueryLiterals', () => {
  it('returns the quoted string literals of a query', () => {
    expect(
      extractQueryLiterals(
        "source = `json-parsed*` | WHERE `payload_parsed.error.detail` = 'upstream timeout'"
      )
    ).toEqual(['upstream timeout']);
    expect(extractQueryLiterals('source = t | where a = "x y" and b = \'zz\'')).toEqual([
      'x y',
      'zz',
    ]);
  });

  it('ignores backtick identifiers, numbers and empty literals', () => {
    expect(extractQueryLiterals("source = `my index` | where code = 502 and a = ''")).toEqual([]);
  });

  it('unescapes, strips LIKE wildcards and removes duplicates', () => {
    expect(
      extractQueryLiterals("source = t | where like(a, '%time%') or b = 'it\\'s' or c = 'time'")
    ).toEqual(['time', "it's"]);
  });

  it('reads a doubled quote inside a literal as one quote (SQL-style escaping)', () => {
    expect(extractQueryLiterals("source = t | where a = 'it''s here'")).toEqual(["it's here"]);
    expect(extractQueryLiterals('source = t | where a = "say ""hi"""')).toEqual(['say "hi"']);
    // the other kind of quote is ordinary text inside a literal
    expect(extractQueryLiterals(`source = t | where a = 'x""y' and b = "p''q"`)).toEqual([
      'x""y',
      "p''q",
    ]);
  });

  it('still separates adjacent literals and skips empty ones', () => {
    expect(
      extractQueryLiterals("source = t | where a = '' and b = 'xx' and c in ('yy', 'zz')")
    ).toEqual(['xx', 'yy', 'zz']);
  });

  it('skips one-character literals', () => {
    expect(extractQueryLiterals("source = t | where a = 'a' or b = 'ok'")).toEqual(['ok']);
  });

  it('only takes literals of positive conditions', () => {
    const literalsOf = (condition: string) =>
      extractQueryLiterals(`source = t | where ${condition}`);
    expect(literalsOf("level != 'debug'")).toEqual([]);
    expect(literalsOf("level <> 'debug'")).toEqual([]);
    expect(literalsOf("level > 'debug'")).toEqual([]);
    expect(literalsOf("not level = 'debug'")).toEqual([]);
    expect(literalsOf("a = 'keep' and not (b = 'debug')")).toEqual(['keep']);
    expect(literalsOf("not like(a, '%debug%')")).toEqual([]);
    expect(literalsOf("level not in ('debug', 'trace')")).toEqual([]);
    expect(literalsOf("length(a) = 3 and concat(a, 'xx') = b")).toEqual([]);
    expect(literalsOf("(a = 'one' or b == 'two') and match(c, 'three')")).toEqual([
      'one',
      'two',
      'three',
    ]);
  });

  it('ignores literals of commands other than where and search', () => {
    expect(
      extractQueryLiterals(
        "source = t | eval x = 'constant' | where a = 'wanted' | fields a | stats count() by b"
      )
    ).toEqual(['wanted']);
    expect(extractQueryLiterals("source = 'my-index' | where a = 'wanted'")).toEqual(['wanted']);
  });

  it('takes the terms of a search expression', () => {
    expect(extractQueryLiterals('search source = t "upstream timeout" AND NOT "debug"')).toEqual([
      'upstream timeout',
    ]);
    expect(extractQueryLiterals("source = t level = 'error'")).toEqual(['error']);
  });

  it('only takes the WHERE conditions of an SQL query', () => {
    expect(
      extractQueryLiterals(
        "SELECT 'label' AS l FROM t WHERE a = 'wanted' AND b NOT LIKE '%skip%' AND c LIKE '%also%' ORDER BY 'zz'"
      )
    ).toEqual(['wanted', 'also']);
    expect(extractQueryLiterals("SELECT * FROM t WHERE a IN ('one', 'two')")).toEqual([
      'one',
      'two',
    ]);
  });

  it('returns nothing for a missing query', () => {
    expect(extractQueryLiterals(undefined)).toEqual([]);
    expect(extractQueryLiterals({})).toEqual([]);
  });
});

describe('mergeHighlightTerms', () => {
  it('merges lists without duplicates', () => {
    expect(mergeHighlightTerms(['a', 'b'], undefined, ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });
});
