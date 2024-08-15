/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { CharStream, CommonTokenStream } from 'antlr4ng';
import { CodeCompletionCore } from 'antlr4-c3';
import { OpenSearchPPLLexer } from './.generated/OpenSearchPPLLexer';
import { OpenSearchPPLParser } from './.generated/OpenSearchPPLParser';
import { CursorPosition, AutocompleteResultBase } from '../shared/types';
import { parseQuery } from '../shared/utils';
import { openSearchPplAutocompleteData } from './opensearch_ppl_autocomplete';
import { QuerySuggestion } from '../../autocomplete';
// import { QueryManager } from './query_manager';

// Function to map token types to their names
const getTokenNameByType = (parser, type) => {
  return parser.vocabulary.getSymbolicName(type);
};

// console.log('suggestions: ', suggestions);

function getExistingTokenNames(tokenStream, lexer, cursorIndex) {
  tokenStream.seek(0); // Reset to start of the stream
  const existingTokens = new Set();
  while (tokenStream.index < cursorIndex) {
    const token = tokenStream.LT(1);
    if (token.type !== lexer.EOF) {
      const tokenName = lexer.symbolicNames[token.type];
      existingTokens.add(tokenName);
    }
    tokenStream.consume();
  }
  return existingTokens;
}

// const q1 =
// "source=opensearch_dashboards_sample_data_logs | where timestamp >= '2024-01-01 08:00:00.000000' and utc_time <= '2024-06-01 23:13:14.021000'  |    stats    avg(bytes) by agent,     erros | sort avg_bytes desc";
// const q2 = "source=opensearch_dashboards_sample_data_logs | where `timestamp` > DATE_SUB(NOW(), INTERVAL 1 DAY) | where machine.os='osx' or  machine.os='ios' |  stats avg(machine.ram) by span(timestamp,1d)";
// const qm = new QueryManager();
// const statsPartial = qm.queryParser().parse(q1).getParsedTokens();
// const nonStatsPartial = qm.queryParser().parse(q2).getParsedTokens();
// const wherePartial = qm.queryParser().parse(q2).getParsedTokens();
// console.log('q1: ', statsPartial);
// console.log('q2: ', nonStatsPartial);
// console.log('wherePartial: ', wherePartial);

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  position,
  query,
  services,
}) => {
  try {
    const { api } = services.uiSettings;
    const dataSetManager = services.data.query.dataSetManager;
    const { lineNumber, column } = position || {};
    const suggestions = getOpenSearchPplAutoCompleteSuggestions(query, {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    });
    const finalSuggestions: QuerySuggestion[] = [];
    // const cursorIndex = selectionStart;
    // const parser = new OpenSearchPPLParser(
    //   new CommonTokenStream(new OpenSearchPPLLexer(CharStream.fromString(query)))
    // );
    // const tree = parser.pplStatement();
    // const core = new CodeCompletionCore(parser);
    // const candidates = core.collectCandidates(cursorIndex, tree);

    // const suggestions = [];
    // for (const [tokenType, tokenValues] of candidates.tokens.entries()) {
    //   const tokenName = getTokenNameByType(parser, tokenType);
    //   if (tokenName) {
    //     suggestions.push(tokenName);
    //   }
    // }
    // Fill in PPL keywords
    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value,
          type: monaco.languages.CompletionItemKind.Keyword,
        }))
      );
    }
    return suggestions;
  } catch (e) {
    return [];
  }
};

export const getOpenSearchPplAutoCompleteSuggestions = (
  query: string,
  cursor: CursorPosition
): AutocompleteResultBase => {
  return parseQuery({
    Lexer: openSearchPplAutocompleteData.Lexer,
    Parser: openSearchPplAutocompleteData.Parser,
    tokenDictionary: openSearchPplAutocompleteData.tokenDictionary,
    ignoredTokens: openSearchPplAutocompleteData.ignoredTokens,
    rulesToVisit: openSearchPplAutocompleteData.rulesToVisit,
    getParseTree: openSearchPplAutocompleteData.getParseTree,
    enrichAutocompleteResult: openSearchPplAutocompleteData.enrichAutocompleteResult,
    query,
    cursor,
  });
};
