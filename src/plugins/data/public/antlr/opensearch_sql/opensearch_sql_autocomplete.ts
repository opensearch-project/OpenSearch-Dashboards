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
  // MySqlAutocompleteResult,
  // OpenSearchSqlAutocompleteResult,
  ProcessVisitedRulesResult,
  TableOrViewSuggestion,
  OpenSearchSqlAutocompleteResult,
} from './types';
import { OpenSearchSQLLexer } from './generated/OpenSearchSQLLexer';
import {
  TableFilterContext,
  OpenSearchSQLParser,
  SelectElementsContext,
  TableNameContext,
} from './generated/OpenSearchSQLParser';
import { OpenSearchSQLParserVisitor } from './generated/OpenSearchSQLParserVisitor';
import {
  TableQueryPosition,
  TokenDictionary,
  getContextSuggestions,
  getPreviousToken,
} from './table';
import { isStartingToWriteRule } from './cursor';
import { shouldSuggestTemplates } from './parse';

const tokenDictionary: TokenDictionary = {
  SPACE: OpenSearchSQLParser.SPACE,
  FROM: OpenSearchSQLParser.FROM,
  OPENING_BRACKET: OpenSearchSQLParser.LR_BRACKET,
  CLOSING_BRACKET: OpenSearchSQLParser.RR_BRACKET,
  // ALTER: OpenSearchSQLParser.ALTER,
  // INSERT: OpenSearchSQLParser.INSERT,
  // UPDATE: OpenSearchSQLParser.UPDATE,
  JOIN: OpenSearchSQLParser.JOIN,
  SEMICOLON: OpenSearchSQLParser.SEMI,
  SELECT: OpenSearchSQLParser.SELECT,
};

// These are keywords that we do not want to show in autocomplete
function getIgnoredTokens(): number[] {
  const tokens = [];

  // const firstOperatorIndex = OpenSearchSQLParser.VAR_ASSIGN;
  // const lastOperatorIndex = OpenSearchSQLParser.ERROR_RECONGNIGION;
  // for (let i = firstOperatorIndex; i <= lastOperatorIndex; i++) {
  //   // We actually want Star to appear in autocomplete
  //   if (i !== OpenSearchSQLParser.STAR) {
  //     tokens.push(i);
  //   }
  // }

  // const firstCharsetIndex = OpenSearchSQLParser.ARMSCII8;
  // const lastCharsetIndex = OpenSearchSQLParser.UTF8MB4;
  // for (let i = firstCharsetIndex; i <= lastCharsetIndex; i++) {
  //   tokens.push(i);
  // }

  // Ignoring functions for now, need custom logic for them later
  const firstFunctionIndex = OpenSearchSQLParser.AVG;
  const lastFunctionIndex = OpenSearchSQLParser.UTC_TIMESTAMP;
  for (let i = firstFunctionIndex; i <= lastFunctionIndex; i++) {
    tokens.push(i);
  }

  // const firstCommonFunctionIndex = OpenSearchSQLParser.ABS;
  // const lastCommonFunctionIndex = OpenSearchSQLParser.X_FUNCTION;
  // for (let i = firstCommonFunctionIndex; i <= lastCommonFunctionIndex; i++) {
  //   tokens.push(i);
  // }

  tokens.push(OpenSearchSQLParser.EOF);

  // KEY is an alias for INDEX, and we should not suggest it because it's legacy
  // tokens.push(OpenSearchSQLParser.KEY);

  return tokens;
}

const ignoredTokens = new Set(getIgnoredTokens());

const rulesToVisit = new Set([
  // We don't need to go inside of those objects, we already know we need to suggest them
  // OpenSearchSQLParser.RULE_userName,
  // OpenSearchSQLParser.RULE_roleName,
  // OpenSearchSQLParser.RULE_databaseName,
  OpenSearchSQLParser.RULE_constant,
  // OpenSearchSQLParser.RULE_triggerName,
  // OpenSearchSQLParser.RULE_indexName,
  OpenSearchSQLParser.RULE_columnName,
  OpenSearchSQLParser.RULE_tableName,
  // OpenSearchSQLParser.RULE_simpleUserName,
  // TODO: merge with uid???
  // We don't need to go inside of next rules, we already know that this is identifier of sorts.
  // There are multiple ids, because different rules use different ids, and we want to stop propagation at each of them, otherwise lots of tokens are getting suggested
  // OpenSearchSQLParser.RULE_fullId,
  // OpenSearchSQLParser.RULE_simpleId,
  // OpenSearchSQLParser.RULE_uid,
  // We don't need to go inside of those rules, we already know that this is a function call
  OpenSearchSQLParser.RULE_aggregateFunction,
  OpenSearchSQLParser.RULE_scalarFunctionName, // Maybe also add nonAggregateWindowedFunction?
  // These functions are very specific, we don't want to suggest them
  OpenSearchSQLParser.RULE_specificFunction,
  OpenSearchSQLParser.RULE_windowFunctionClause,
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

  visitAtomTableItem = (context: TableFilterContext): {} => {
    try {
      const rawAlias = context.uid()?.getText();
      // For some reason LEFT | RIGHT keyword gets confused with alias
      const isAliasPartOfJoinStatement =
        rawAlias?.toLowerCase() === 'left' || rawAlias?.toLowerCase() === 'right';

      this.symbolTable.addNewSymbolOfType(
        TableSymbol,
        this.scope,
        context.tableName().getText(),
        isAliasPartOfJoinStatement ? undefined : rawAlias
      );
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

function processVisitedRules(
  rules: c3.CandidatesCollection['rules'],
  cursorTokenIndex: number,
  tokenStream: TokenStream
): ProcessVisitedRulesResult<OpenSearchSqlAutocompleteResult> {
  let suggestViewsOrTables: OpenSearchSqlAutocompleteResult['suggestViewsOrTables'];
  let suggestAggregateFunctions = false;
  let suggestFunctions = false;
  // let suggestIndexes = false;
  // let suggestTriggers = false;
  // let suggestDatabases = false;
  // let suggestRoles = false;
  // let suggestUsers = false;

  // let shouldSuggestConstraints = false;
  let shouldSuggestColumns = false;
  let shouldSuggestColumnAliases = false;

  console.log('processVisitedRules: ', rules);
  console.log('OpenSearchSQLParser.RULE_tableName: ', OpenSearchSQLParser.RULE_tableName);

  for (const [ruleId, rule] of rules) {
    if (!isStartingToWriteRule(cursorTokenIndex, rule)) {
      continue;
    }

    switch (ruleId) {
      case OpenSearchSQLParser.RULE_tableName: {
        // if (rule.ruleList.includes(OpenSearchSQLParser.RULE_createTable)) {
        //   break;
        // }

        // if (
        //   getPreviousToken(tokenStream, tokenDictionary, cursorTokenIndex, OpenSearchSQLParser.VIEW)
        // ) {
        //   suggestViewsOrTables = TableOrViewSuggestion.VIEWS;
        // } else
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
      // case OpenSearchSQLParser.RULE_fullId: {
      //   if (
      //     getPreviousToken(
      //       tokenStream,
      //       tokenDictionary,
      //       cursorTokenIndex,
      //       OpenSearchSQLParser.VIEW
      //     ) &&
      //     (rule.ruleList.includes(OpenSearchSQLParser.RULE_alterView) ||
      //       rule.ruleList.includes(OpenSearchSQLParser.RULE_dropView))
      //   ) {
      //     suggestViewsOrTables = TableOrViewSuggestion.VIEWS;
      //   }
      //   break;
      // }
      // case OpenSearchSQLParser.RULE_aggregateWindowedFunction: {
      //   suggestAggregateFunctions = true;
      //   break;
      // }
      case OpenSearchSQLParser.RULE_aggregateFunction: {
        suggestAggregateFunctions = true;
        break;
      }
      case OpenSearchSQLParser.RULE_scalarFunctionName: {
        suggestFunctions = true;
        break;
      }
      // case OpenSearchSQLParser.RULE_triggerName: {
      //   suggestTriggers = true;
      //   break;
      // }
      // case OpenSearchSQLParser.RULE_indexName: {
      //   suggestIndexes = true;
      //   break;
      // }
      // case OpenSearchSQLParser.RULE_constraintName: {
      //   shouldSuggestConstraints = true;
      //   break;
      // }
      // case OpenSearchSQLParser.RULE_databaseName: {
      //   suggestDatabases = true;
      //   break;
      // }
      // case OpenSearchSQLParser.RULE_roleName: {
      //   suggestRoles = true;
      //   break;
      // }
      // case OpenSearchSQLParser.RULE_userName: {
      //   suggestUsers = true;
      //   break;
      // }
      // case OpenSearchSQLParser.RULE_fullColumnName:
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
      // case OpenSearchSQLParser.RULE_uid: {
      //   if (
      //     (rule.ruleList.includes(OpenSearchSQLParser.RULE_alterSpecification) &&
      //       !getPreviousToken(
      //         tokenStream,
      //         tokenDictionary,
      //         cursorTokenIndex,
      //         OpenSearchSQLParser.ADD
      //       )) ||
      //     rule.ruleList.includes(OpenSearchSQLParser.RULE_indexColumnName)
      //   ) {
      //     shouldSuggestColumns = true;
      //   }
      //   break;
      // }
    }
  }

  return {
    suggestViewsOrTables,
    suggestAggregateFunctions,
    suggestFunctions,
    // suggestIndexes,
    // suggestTriggers,
    // suggestDatabases,
    // suggestRoles,
    // suggestUsers,
    // shouldSuggestConstraints,
    shouldSuggestColumns,
    shouldSuggestColumnAliases,
  };
}

function getParseTree(
  parser: OpenSearchSQLParser,
  type?: TableQueryPosition['type'] | 'select'
): ParseTree {
  if (!type) {
    return parser.root();
  }

  switch (type) {
    case 'from':
      return parser.fromClause();
    // case 'alter':
    //   return parser.alterTable();
    // case 'insert':
    //   return parser.insertStatement();
    // case 'update':
    //   return parser.multipleUpdateStatement();
    case 'select':
      return parser.selectStatement();
    default:
      return parser.root();
  }
}

function enrichAutocompleteResult(
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
  console.log('contextSuggestionsNeeded: ', contextSuggestionsNeeded);
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

    console.log('tableContextSuggestion: ', tableContextSuggestion);
    console.log('suggestColumnAliases: ', suggestColumnAliases);

    if (shouldSuggestColumns && tableContextSuggestion) {
      result.suggestColumns = tableContextSuggestion;
    }
    if (shouldSuggestConstraints && tableContextSuggestion) {
      result.suggestConstraints = tableContextSuggestion;
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
