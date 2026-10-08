/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream } from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { PPL_COMMAND_KEYWORDS } from './command_suggestion';

// Grammar drift alarm. The suggestion no longer reads a static keyword map at
// runtime — it derives candidates from the ATN's FIRST(commands) set. This guard
// asserts that the ATN-derived set on the compiled simplified grammar still
// covers the curated `PPL_COMMAND_KEYWORDS` baseline, so a grammar change that
// renames or drops a command keyword (e.g. `WHERE` -> `FILTER`) fails loudly
// here rather than silently killing the suggestion for that command.
//
// `PPL_COMMAND_KEYWORDS` is intentionally a superset spanning the simplified
// compiled grammar and the full server (runtime) grammar. `MULTISEARCH`/`UNION`
// are runtime-only command *tokens* — absent from the compiled lexer entirely —
// so they are exempted from the lexer-existence check. They are still exercised
// against the runtime grammar by the E2E bundle test in production.
const NOT_IN_COMPILED_LEXER = new Set<string>(['MULTISEARCH', 'UNION']);

// Symbolic names whose lowercase spelling is NOT in the compiled grammar's
// FIRST(`commands`) set — so the ATN-coverage drift alarm rightly skips them:
//
//  - Runtime-only commands (`MULTISEARCH`, `UNION`, `REPLACE`): `REPLACE`'s
//    token exists in the compiled lexer but `replace` is not a compiled
//    `commands` alternative; the other two are absent entirely.
//  - Leading / statement-position commands (`SEARCH`, `DESCRIBE`, `SHOW`,
//    `EXPLAIN`): these start a query rather than follow a pipe, so they live in
//    `root`, not `commands`. They are deliberately NOT suggestion candidates — a
//    misspelled leading command (`searchh source=...`, `descibe accounts`)
//    either parses as a field/search expression or errors with a follow-set that
//    never contained these keywords. Verified old-vs-new: the static-map code
//    never produced a suggestion for them either, so omitting them from the
//    ATN-derived candidate set is a no-op, not a regression.
const NOT_IN_COMPILED_COMMANDS_RULE = new Set<string>([
  'MULTISEARCH',
  'UNION',
  'REPLACE',
  'SEARCH',
  'DESCRIBE',
  'SHOW',
  'EXPLAIN',
]);

/**
 * Re-derive the suggestion's candidate set exactly as `commandCandidatesFromATN`
 * does in production: FIRST(`commands`), keyword-shaped symbolic names only,
 * lowercased. Kept inline (not imported) so this guard exercises the same ATN
 * walk the runtime relies on rather than trusting a shared helper.
 */
function compiledCommandSpellings(): Set<string> {
  const parser = new SimplifiedOpenSearchPPLParser(
    new CommonTokenStream(new SimplifiedOpenSearchPPLLexer(CharStream.fromString('')))
  );
  const ruleIndex = parser.getRuleIndex('commands');
  const startState = parser.atn.ruleToStartState[ruleIndex];
  const spellings = new Set<string>();
  if (ruleIndex < 0 || !startState) {
    return spellings;
  }
  for (const tokenType of parser.atn.nextTokens(startState).toArray()) {
    const symbolic = parser.vocabulary.getSymbolicName(tokenType);
    if (symbolic && /^[A-Z][A-Z0-9]*$/.test(symbolic)) {
      spellings.add(symbolic.toLowerCase());
    }
  }
  return spellings;
}

describe('PPL command keyword grammar guard', () => {
  const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(''));
  const knownSymbolic = new Set<string>();
  for (let t = 0; t <= lexer.vocabulary.maxTokenType; t++) {
    const name = lexer.vocabulary.getSymbolicName(t);
    if (name) {
      knownSymbolic.add(name);
    }
  }

  it('the compiled grammar exposes a "commands" rule (ATN derivation precondition)', () => {
    const parser = new SimplifiedOpenSearchPPLParser(
      new CommonTokenStream(new SimplifiedOpenSearchPPLLexer(CharStream.fromString('')))
    );
    expect(parser.getRuleIndex('commands')).toBeGreaterThanOrEqual(0);
  });

  it('every command symbolic name still exists in the compiled lexer', () => {
    const missing: string[] = [];
    for (const symbolic of PPL_COMMAND_KEYWORDS.keys()) {
      if (NOT_IN_COMPILED_LEXER.has(symbolic)) {
        continue;
      }
      if (!knownSymbolic.has(symbolic)) {
        missing.push(symbolic);
      }
    }
    expect(missing).toEqual([]);
  });

  it('the ATN-derived candidate set covers the curated baseline (drift alarm)', () => {
    const derived = compiledCommandSpellings();
    const uncovered: string[] = [];
    for (const [symbolic, spelling] of PPL_COMMAND_KEYWORDS) {
      if (NOT_IN_COMPILED_COMMANDS_RULE.has(symbolic)) {
        continue;
      }
      if (!derived.has(spelling)) {
        uncovered.push(spelling);
      }
    }
    expect(uncovered).toEqual([]);
  });

  it('the ATN-derived candidate set is non-trivial (catches an empty derivation)', () => {
    expect(compiledCommandSpellings().size).toBeGreaterThan(20);
  });

  it('the keyword map is non-trivial (catches an accidental empty map)', () => {
    expect(PPL_COMMAND_KEYWORDS.size).toBeGreaterThan(20);
  });
});
