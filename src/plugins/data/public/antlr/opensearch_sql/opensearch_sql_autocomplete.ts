/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParseTree, TokenStream } from 'antlr4ng';
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

const tokenDictionary: TokenDictionary = {
  SPACE: OpenSearchSQLParser.SPACE,
  FROM: OpenSearchSQLParser.FROM,
  OPENING_BRACKET: OpenSearchSQLParser.LR_BRACKET,
  CLOSING_BRACKET: OpenSearchSQLParser.RR_BRACKET,
  JOIN: OpenSearchSQLParser.JOIN,
  SEMICOLON: OpenSearchSQLParser.SEMI,
  SELECT: OpenSearchSQLParser.SELECT,
};

// These are keywords that we do not want to show in autocomplete
export function getIgnoredTokens(): number[] {
  const tokens = [];

  const firstOperatorIndex = OpenSearchSQLParser.SLASH;
  const lastOperatorIndex = OpenSearchSQLParser.ERROR_RECOGNITION;
  for (let i = firstOperatorIndex; i <= lastOperatorIndex; i++) {
    // We actually want Star to appear in autocomplete
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
      this.symbolTable.addNewSymbolOfType(ColumnAliasSymbol, this.scope, context.uid().getText());
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

  for (const [ruleId, rule] of rules) {
    switch (ruleId) {
      case OpenSearchSQLParser.RULE_tableName: {
        if (
          getPreviousToken(
            tokenStream,
            tokenDictionary,
            cursorTokenIndex,
            OpenSearchSQLParser.TABLES
          )
        ) {
          suggestViewsOrTables = TableOrViewSuggestion.TABLES;
        } else {
          suggestViewsOrTables = TableOrViewSuggestion.ALL;
        }
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
      case OpenSearchSQLParser.RULE_constant: {
        const previousToken = getPreviousToken(
          tokenStream,
          tokenDictionary,
          cursorTokenIndex,
          OpenSearchSQLLexer.ID
        );
        if (previousToken) {
          suggestValuesForColumn = previousToken.text;
        }
        break;
      }
    }
  }

  return {
    suggestViewsOrTables,
    suggestAggregateFunctions,
    suggestScalarFunctions,
    shouldSuggestColumns,
    shouldSuggestColumnAliases,
    suggestValuesForColumn,
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
