/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable max-classes-per-file */

import * as c3 from 'antlr4-c3';
import { ColumnAliasSuggestion, SymbolTableVisitor, Table } from '../shared/types';

export class TableSymbol extends c3.TypedSymbol {
  name: string;
  alias: string | undefined;

  constructor(name: string, alias?: string, type?: c3.IType) {
    super(name, type);

    this.name = name;
    this.alias = alias;
  }
}

export function getUniqueTableSuggestions(symbols: TableSymbol[] = []): Table[] {
  const suggestionsMap = symbols.reduce((acc, table) => {
    const aliases = acc[table.name] ?? new Set();
    if (table.alias) {
      aliases.add(table.alias);
    }

    acc[table.name] = aliases;
    return acc;
  }, {} as Record<string, Set<string>>);
  return Object.keys(suggestionsMap).reduce((acc, tableName) => {
    const aliases = suggestionsMap[tableName] as Set<string>;
    if (aliases.size > 0) {
      aliases?.forEach((alias) => {
        acc.push({ name: tableName, alias });
      });
    } else {
      acc.push({ name: tableName });
    }

    return acc;
  }, [] as Table[]);
}

export function getTablesFromSymbolTable(visitor: SymbolTableVisitor): Table[] {
  const suggestions = visitor.symbolTable.getNestedSymbolsOfTypeSync(TableSymbol);
  return getUniqueTableSuggestions(suggestions);
}

export class ColumnAliasSymbol extends c3.TypedSymbol {
  name: string;

  constructor(name: string, type?: c3.IType) {
    super(name, type);

    this.name = name;
  }
}

export function getColumnAliasesFromSymbolTable(
  visitor: SymbolTableVisitor
): ColumnAliasSuggestion[] {
  return visitor.symbolTable
    .getNestedSymbolsOfTypeSync(ColumnAliasSymbol)
    .map(({ name }) => ({ name }));
}
