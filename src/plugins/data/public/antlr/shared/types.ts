/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as c3 from 'antlr4-c3';
import {
  AbstractParseTreeVisitor,
  CharStream,
  CommonTokenStream,
  ParseTree,
  ParserRuleContext,
  TokenStream,
  Lexer as LexerType,
  Parser as ParserType,
} from 'antlr4ng';
import { TableQueryPosition, TokenDictionary } from '../opensearch_sql/table';

export interface AutocompleteResultBase {
  errors: ParserSyntaxError[];
  suggestKeywords?: KeywordSuggestion[];
  suggestTemplates?: boolean;
  suggestAggregateFunctions?: boolean;
  suggestScalarFunctions?: boolean;
  suggestColumns?: ColumnSuggestion;
  suggestColumnAliases?: ColumnAliasSuggestion[];
  suggestDatabases?: boolean;
  suggestValuesForColumn?: string;
}

export interface ParserSyntaxError extends TokenPosition {
  message: string;
}

export interface TokenPosition {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface KeywordSuggestion {
  value: string;
  id: number;
}

export type ColumnSuggestion = TableContextSuggestion;

export interface TableContextSuggestion {
  tables?: Table[];
}

export interface Table {
  name: string;
  alias?: string;
}

export interface ColumnAliasSuggestion {
  name: string;
}

export type LexerConstructor<T> = new (input: CharStream) => T;

export type ParserConstructor<T> = new (input: CommonTokenStream) => T;

export type SymbolTableVisitorConstructor<T> = new () => T;

export type GetParseTree<P> = (
  parser: P,
  type?: TableQueryPosition['type'] | 'select'
) => ParseTree;

export type EnrichAutocompleteResult<A extends AutocompleteResultBase> = (
  result: AutocompleteResultBase,
  rules: c3.CandidatesCollection['rules'],
  tokenStream: TokenStream,
  cursorTokenIndex: number,
  cursor: CursorPosition,
  query: string
) => A;

export interface CursorPosition {
  line: number;
  column: number;
}

export interface OpenSearchSqlAutocompleteResult extends AutocompleteResultBase {
  suggestViewsOrTables?: TableOrViewSuggestion;
}

export interface OpenSearchPplAutocompleteResult extends AutocompleteResultBase {
  suggestSourcesOrTables?: SourceOrTableSuggestion;
}

export enum TableOrViewSuggestion {
  ALL = 'ALL',
  TABLES = 'TABLES',
  VIEWS = 'VIEWS',
}

export enum SourceOrTableSuggestion {
  ALL = 'ALL',
  TABLES = 'TABLES',
  SOURCES = 'SOURCES',
}

export type ConstraintSuggestion = TableContextSuggestion;

export interface ISymbolTableVisitor {
  symbolTable: c3.SymbolTable;
  scope: c3.ScopedSymbol;
}

export type SymbolTableVisitor = ISymbolTableVisitor & AbstractParseTreeVisitor<{}>;

export interface AutocompleteData<
  A extends AutocompleteResultBase,
  L extends LexerType,
  P extends ParserType
> {
  Lexer: LexerConstructor<L>;
  Parser: ParserConstructor<P>;
  getParseTree: GetParseTree<P>;
  tokenDictionary: TokenDictionary;
  ignoredTokens: Set<number>;
  rulesToVisit: Set<number>;
  enrichAutocompleteResult: EnrichAutocompleteResult<A>;
  context?: ParserRuleContext;
}

export type ProcessVisitedRulesResult<A extends AutocompleteResultBase> = Partial<A> & {
  shouldSuggestColumns?: boolean;
  shouldSuggestColumnAliases?: boolean;
  shouldSuggestConstraints?: boolean;
};

export interface ParsingSubject<A extends AutocompleteResultBase, L, P> {
  Lexer: LexerConstructor<L>;
  Parser: ParserConstructor<P>;
  tokenDictionary: TokenDictionary;
  ignoredTokens: Set<number>;
  rulesToVisit: Set<number>;
  getParseTree: GetParseTree<P>;
  enrichAutocompleteResult: EnrichAutocompleteResult<A>;
  query: string;
  cursor: CursorPosition;
  context?: ParserRuleContext;
}
