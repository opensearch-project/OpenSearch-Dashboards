/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParseTree, Token, TokenStream } from 'antlr4ng';
import * as c3 from 'antlr4-c3';
import { ColumnAliasSymbol, TableSymbol } from './symbol_table';
import {
  AutocompleteData,
  AutocompleteResultBase,
  CursorPosition,
  ISymbolTableVisitor,
  ProcessVisitedRulesResult,
  TableOrViewSuggestion,
  OpenSearchSqlAutocompleteResult,
  ColumnValuePredicate,
} from '../shared/types';
import { OpenSearchSQLLexer } from './.generated/OpenSearchSQLLexer';
import {
  OpenSearchSQLParser,
  SelectElementsContext,
  TableNameContext,
} from './.generated/OpenSearchSQLParser';
import { OpenSearchSQLParserVisitor } from './.generated/OpenSearchSQLParserVisitor';
import {
  TableQueryPosition,
  TokenDictionary,
  getContextSuggestions,
  getPreviousToken,
} from './table';
import { shouldSuggestTemplates } from './parse';
import { removePotentialBackticks } from '../shared/utils';

const tokenDictionary: TokenDictionary = {
  SPACE: OpenSearchSQLParser.SPACE,
  FROM: OpenSearchSQLParser.FROM,
  OPENING_BRACKET: OpenSearchSQLParser.LR_BRACKET,
  CLOSING_BRACKET: OpenSearchSQLParser.RR_BRACKET,
  JOIN: OpenSearchSQLParser.JOIN,
  SEMICOLON: OpenSearchSQLParser.SEMI,
  SELECT: OpenSearchSQLParser.SELECT,
  ID: OpenSearchSQLParser.ID,
};

// These are keywords that we do not want to show in autocomplete
export function getIgnoredTokens(): number[] {
  const tokens = [];

  const firstOperatorIndex = OpenSearchSQLParser.SLASH;
  const lastOperatorIndex = OpenSearchSQLParser.ERROR_RECOGNITION;
  for (let i = firstOperatorIndex; i <= lastOperatorIndex; i++) {
    tokens.push(i);
  }

  // Ignoring functions for now, need custom logic for them later
  const firstFunctionIndex = OpenSearchSQLParser.AVG;
  const lastFunctionIndex = OpenSearchSQLParser.TRIM;
  for (let i = firstFunctionIndex; i <= lastFunctionIndex; i++) {
    tokens.push(i);
  }

  const firstCommonFunctionIndex = OpenSearchSQLParser.ABS;
  const lastCommonFunctionIndex = OpenSearchSQLParser.MATCH_BOOL_PREFIX;
  for (let i = firstCommonFunctionIndex; i <= lastCommonFunctionIndex; i++) {
    tokens.push(i);
  }

  tokens.push(OpenSearchSQLParser.EOF);

  return tokens;
}

const ignoredTokens = new Set(getIgnoredTokens());

const rulesToVisit = new Set([
  OpenSearchSQLParser.RULE_constant,
  OpenSearchSQLParser.RULE_columnName,
  OpenSearchSQLParser.RULE_tableName,
  OpenSearchSQLParser.RULE_aggregateFunction,
  OpenSearchSQLParser.RULE_scalarFunctionName,
  OpenSearchSQLParser.RULE_specificFunction,
  OpenSearchSQLParser.RULE_windowFunctionClause,
  OpenSearchSQLParser.RULE_comparisonOperator,
  OpenSearchSQLParser.RULE_predicate,
]);

class OpenSearchSqlSymbolTableVisitor
  extends OpenSearchSQLParserVisitor<{}>
  implements ISymbolTableVisitor {
  symbolTable: c3.SymbolTable;
  scope: c3.ScopedSymbol;

  constructor() {
    super();
    this.symbolTable = new c3.SymbolTable('', { allowDuplicateSymbols: true });
    this.scope = this.symbolTable.addNewSymbolOfType(c3.ScopedSymbol, undefined);
  }

  visitTableName = (context: TableNameContext): {} => {
    try {
      this.symbolTable.addNewSymbolOfType(TableSymbol, this.scope, context.getText());
    } catch (error) {
      if (!(error instanceof c3.DuplicateSymbolError)) {
        throw error;
      }
    }

    return this.visitChildren(context) as {};
  };

  visitSelectElementAlias = (context: SelectElementsContext): {} => {
    try {
      this.symbolTable.addNewSymbolOfType(ColumnAliasSymbol, this.scope, context.getText());
    } catch (error) {
      if (!(error instanceof c3.DuplicateSymbolError)) {
        throw error;
      }
    }

    return this.visitChildren(context) as {};
  };
}

export function processVisitedRules(
  rules: c3.CandidatesCollection['rules'],
  cursorTokenIndex: number,
  tokenStream: TokenStream
): ProcessVisitedRulesResult<OpenSearchSqlAutocompleteResult> {
  let suggestViewsOrTables: OpenSearchSqlAutocompleteResult['suggestViewsOrTables'];
  let suggestAggregateFunctions = false;
  let suggestScalarFunctions = false;
  let shouldSuggestColumns = false;
  let shouldSuggestColumnAliases = false;
  let suggestValuesForColumn: string | undefined;
  let suggestColumnValuePredicate: ColumnValuePredicate | undefined;
  const rerunWithoutRules: number[] = [];

  for (const [ruleId, rule] of rules) {
    switch (ruleId) {
      case OpenSearchSQLParser.RULE_tableName: {
        // prevent table suggestion if the previous token is an ID (before WS)
        if (tokenStream.get(cursorTokenIndex - 2).type === OpenSearchSQLParser.ID) {
          break;
        }

        if (
          getPreviousToken(
            tokenStream,
            tokenDictionary,
            cursorTokenIndex,
            OpenSearchSQLParser.TABLES
          )
        ) {
          suggestViewsOrTables = TableOrViewSuggestion.TABLES;
        }
        // we cannot stop a table suggestion if there exists an identifier because that is common within select clauses
        suggestViewsOrTables = TableOrViewSuggestion.ALL;

        break;
      }
      case OpenSearchSQLParser.RULE_aggregateFunction: {
        suggestAggregateFunctions = true;
        shouldSuggestColumns = true;
        break;
      }
      case OpenSearchSQLParser.RULE_scalarFunctionName: {
        suggestScalarFunctions = true;
        break;
      }
      case OpenSearchSQLParser.RULE_columnName: {
        shouldSuggestColumns = true;
        if (
          rule.ruleList.includes(OpenSearchSQLParser.RULE_groupByElements) ||
          rule.ruleList.includes(OpenSearchSQLParser.RULE_orderByElement)
        ) {
          shouldSuggestColumnAliases = true;
        }
        break;
      }
      case OpenSearchSQLParser.RULE_predicate: {
        rerunWithoutRules.push(ruleId); // rerun to fetch aggs by blocking pred

        const validIDToken = (token: Token) => {
          return (
            token.type === OpenSearchSQLParser.ID ||
            token.type === OpenSearchSQLParser.BACKTICK_QUOTE_ID
          );
        };

        /**
         * create a list of the tokens from the start of the pedicate to the end
         * intentionally omit all tokens with type SPACE
         * now we know we only have "significant tokens"
         */

        const expressionStart = rule.startTokenIndex;

        // from expressionStart to cursorTokenIndex, grab all the tokens and put them in a list.
        // ignore whitespace tokens, and wrap up IDs into one token if dot separated
        const sigTokens = [];
        for (let i = expressionStart; i < cursorTokenIndex; i++) {
          const token = tokenStream.get(i);
          // remove spaces
          if (token.type === OpenSearchSQLParser.SPACE) {
            continue;
          }
          // remove NOT, because it is irrelevant for suggestions and prevents IN suggestions
          if (token.type === OpenSearchSQLParser.NOT) {
            continue;
          }
          // chain together IDs on DOT
          if (token.type === OpenSearchSQLParser.DOT) {
            if (sigTokens.length < 1 || !validIDToken(sigTokens[sigTokens.length - 1])) {
              continue;
            }
            i++;
            const nextToken = tokenStream.get(i);
            if (!validIDToken(nextToken)) {
              continue;
            }
            sigTokens[sigTokens.length - 1].text +=
              '.' + removePotentialBackticks(nextToken?.text ?? '');
            continue;
          }
          if (validIDToken(token)) {
            token.text = removePotentialBackticks(token.text ?? '');
            sigTokens.push(token);
            continue;
          }
          sigTokens.push(token);
        }

        // catch columnName rule so try to match with it to suggest beyond it.
        // this means it can include DOTs, be ID, or be BACKTICK_QUOTE_ID. we'll avoid
        // matching with keywordsCanBeId and scalarFunctionName for now

        // if we don't have any tokens so far, suggest fields
        if (sigTokens.length === 0) {
          suggestColumnValuePredicate = ColumnValuePredicate.COLUMN;
          break;
        }

        // if we have one token that is an ID, we have to suggest operators
        if (sigTokens.length === 1 && validIDToken(sigTokens[0])) {
          suggestColumnValuePredicate = ColumnValuePredicate.OPERATOR;
          break;
        }

        // if our second token is an EQUAL, and we have no other tokens, we're in a binaryComparisonPredicate
        // and should suggest values
        if (
          sigTokens.length === 2 &&
          validIDToken(sigTokens[0]) &&
          sigTokens[1].type === OpenSearchSQLParser.EQUAL_SYMBOL
        ) {
          suggestColumnValuePredicate = ColumnValuePredicate.VALUE;
          suggestValuesForColumn = removePotentialBackticks(sigTokens[0].text ?? '');
          break;
        }

        // if our second token is an IN, and we have no other tokens, we're in an inPredicate and should
        // suggest LPAREN
        if (
          sigTokens.length === 2 &&
          validIDToken(sigTokens[0]) &&
          sigTokens[1].type === OpenSearchSQLParser.IN
        ) {
          suggestColumnValuePredicate = ColumnValuePredicate.LPAREN;
          break;
        }

        // if we're in an inPredicate and the syntax is right, we should suggest values or a post
        // value-term suggestion (comma/RPAREN)
        if (
          sigTokens.length >= 3 &&
          validIDToken(sigTokens[0]) &&
          sigTokens[1].type === OpenSearchSQLParser.IN &&
          sigTokens[2].type === OpenSearchSQLParser.LR_BRACKET &&
          sigTokens[sigTokens.length - 1].type !== OpenSearchSQLParser.RR_BRACKET
        ) {
          if (sigTokens[sigTokens.length - 1].type === OpenSearchSQLParser.STRING_LITERAL) {
            suggestColumnValuePredicate = ColumnValuePredicate.END_IN_TERM;
          } else {
            suggestColumnValuePredicate = ColumnValuePredicate.VALUE;
            suggestValuesForColumn = removePotentialBackticks(
              tokenStream.get(expressionStart).text ?? ''
            );
          }
          break;
        }

        break;
      }
    }
  }

  return {
    rerunWithoutRules,
    suggestViewsOrTables,
    suggestAggregateFunctions,
    suggestScalarFunctions,
    shouldSuggestColumns,
    shouldSuggestColumnAliases,
    suggestValuesForColumn,
    suggestColumnValuePredicate,
  };
}

export function getParseTree(
  parser: OpenSearchSQLParser,
  type?: TableQueryPosition['type'] | 'select'
): ParseTree {
  if (!type) {
    return parser.root();
  }

  switch (type) {
    case 'from':
      return parser.fromClause();
    case 'select':
      return parser.selectStatement();
    default:
      return parser.root();
  }
}

export function enrichAutocompleteResult(
  baseResult: AutocompleteResultBase,
  rules: c3.CandidatesCollection['rules'],
  tokenStream: TokenStream,
  cursorTokenIndex: number,
  cursor: CursorPosition,
  query: string
): OpenSearchSqlAutocompleteResult {
  const {
    shouldSuggestColumns,
    shouldSuggestColumnAliases,
    shouldSuggestConstraints,
    ...suggestionsFromRules
  } = processVisitedRules(rules, cursorTokenIndex, tokenStream);
  const suggestTemplates = shouldSuggestTemplates(query, cursor);
  const result: OpenSearchSqlAutocompleteResult = {
    ...baseResult,
    ...suggestionsFromRules,
    suggestTemplates,
  };
  const contextSuggestionsNeeded =
    shouldSuggestColumns || shouldSuggestConstraints || shouldSuggestColumnAliases;
  if (contextSuggestionsNeeded) {
    const visitor = new OpenSearchSqlSymbolTableVisitor();
    const { tableContextSuggestion, suggestColumnAliases } = getContextSuggestions(
      OpenSearchSQLLexer,
      OpenSearchSQLParser,
      visitor,
      tokenDictionary,
      getParseTree,
      tokenStream,
      cursor,
      query
    );

    if (shouldSuggestColumns && tableContextSuggestion) {
      result.suggestColumns = tableContextSuggestion;
    }

    if (shouldSuggestColumnAliases && suggestColumnAliases) {
      result.suggestColumnAliases = suggestColumnAliases;
    }
  }

  return result;
}

export const openSearchSqlAutocompleteData: AutocompleteData<
  OpenSearchSqlAutocompleteResult,
  OpenSearchSQLLexer,
  OpenSearchSQLParser
> = {
  Lexer: OpenSearchSQLLexer,
  Parser: OpenSearchSQLParser,
  tokenDictionary,
  ignoredTokens,
  rulesToVisit,
  getParseTree,
  enrichAutocompleteResult,
};
