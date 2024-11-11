/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParserRuleContext, ParseTree, TokenStream } from 'antlr4ng';
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

  const operatorsToInclude = [OpenSearchSQLParser.COMMA];

  const firstOperatorIndex = OpenSearchSQLParser.SLASH;
  const lastOperatorIndex = OpenSearchSQLParser.ERROR_RECOGNITION;
  for (let i = firstOperatorIndex; i <= lastOperatorIndex; i++) {
    if (!operatorsToInclude.includes(i)) {
      tokens.push(i);
    }
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

// TODO: double check symbol table
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
  let rerunAndConstrain: ParserRuleContext | undefined;

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
        // console.log(rule.startTokenIndex);

        // TODO: set rerunAndConstrain to the predicate parser rule context

        // TODO: make sure that the IN operator can also have values

        // TODO: handle issue where we get the column name no matter if the predicate starts some other way

        // need to check if we have a binary comparison predicate
        // if we do, need to find out if we are in the field, value, or operator
        // depending on which, just return an object that will flag any one of those three

        const expressionStart = rule.startTokenIndex;

        // basically walk through the tokens between the expressionStart and cursorTokenIndex,
        // if we're only on the first token, we're in the column. if theres a first token, WS,
        // then another token like EOF, we need to suggest operators. if we're past an operator,
        // and we need to check if that middle token is an EQUAL because we only care about that,
        // and we have a WS, we can go to value

        // at start of pred, need to suggest columns
        if (expressionStart === cursorTokenIndex) {
          suggestColumnValuePredicate = ColumnValuePredicate.COLUMN;
          break;
        }

        // another predicate appears, need to suggest equal/operator
        if (expressionStart + 2 === cursorTokenIndex) {
          suggestColumnValuePredicate = ColumnValuePredicate.OPERATOR;
          break;
        }

        // conditional meant to catch binaryComparisonPredicate only
        if (
          tokenStream.get(expressionStart + 2).type === OpenSearchSQLParser.EQUAL_SYMBOL &&
          expressionStart + 4 === cursorTokenIndex
        ) {
          suggestColumnValuePredicate = ColumnValuePredicate.VALUE;
          // console.log('prev field', tokenStream.get(expressionStart).text);
          suggestValuesForColumn = tokenStream.get(expressionStart).text; // todo: seems like this breaks if we have some extra stuff in front for our pred
          break;
        }

        // conditional meant to catch inPredicate
        if (
          tokenStream.get(expressionStart + 2).type === OpenSearchSQLParser.IN &&
          tokenStream.get(expressionStart + 4).type === OpenSearchSQLParser.LR_BRACKET &&
          expressionStart + 4 < cursorTokenIndex
        ) {
          suggestColumnValuePredicate = ColumnValuePredicate.VALUE;
          // console.log('prev field', tokenStream.get(expressionStart).text);
          suggestValuesForColumn = tokenStream.get(expressionStart).text;
          break;
        }

        break;
      }
      case OpenSearchSQLParser.RULE_predicate: {
        // need to check if we have a binary comparison predicate
        // if we do, need to find out if we are in the field, value, or operator
        // depending on which, just return an object that will flag any one of those three

        const expressionStart = rule.startTokenIndex;

        // basically walk through the tokens between the expressionStart and cursorTokenIndex,
        // if we're only on the first token, we're in the column. if theres a first token, WS,
        // then another token like EOF, we need to suggest operators. if we're past an operator,
        // and we need to check if that middle token is an EQUAL because we only care about that,
        // and we have a WS, we can go to value

        if (expressionStart === cursorTokenIndex) {
          suggestColumnValuePredicate = ColumnValuePredicate.COLUMN;
          break;
        }

        if (expressionStart + 2 === cursorTokenIndex) {
          suggestColumnValuePredicate = ColumnValuePredicate.OPERATOR;
          break;
        }

        if (
          tokenStream.get(expressionStart + 2).type === OpenSearchSQLParser.EQUAL_SYMBOL &&
          expressionStart + 4 === cursorTokenIndex
        ) {
          suggestColumnValuePredicate = ColumnValuePredicate.VALUE;
          break;
        }

        break;
      }
    }
  }

  return {
    rerunAndConstrain,
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
