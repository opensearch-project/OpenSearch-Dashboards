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
    expect(extractQueryLiterals('source = t | where a = "x y" and b = \'z\'')).toEqual([
      'x y',
      'z',
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
      extractQueryLiterals("source = t | where a = '' and b = 'x' and c in ('y', 'z')")
    ).toEqual(['x', 'y', 'z']);
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
