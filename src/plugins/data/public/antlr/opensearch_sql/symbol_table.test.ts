/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TableSymbol,
  getTablesFromSymbolTable,
  getUniqueTableSuggestions,
  ColumnAliasSymbol,
  getColumnAliasesFromSymbolTable,
} from './symbol_table'; // Update the path
import { SymbolTableVisitor } from '../shared/types';

describe('TableSymbol', () => {
  it('should create a TableSymbol instance', () => {
    const symbol = new TableSymbol('tableName', 'aliasName', undefined);
    expect(symbol.name).toBe('tableName');
    expect(symbol.alias).toBe('aliasName');
    expect(symbol.type).toBeUndefined();
  });

  it('should create a TableSymbol instance without alias', () => {
    const symbol = new TableSymbol('tableName', undefined, undefined);
    expect(symbol.name).toBe('tableName');
    expect(symbol.alias).toBeUndefined();
    expect(symbol.type).toBeUndefined();
  });
});

describe('getUniqueTableSuggestions', () => {
  it('should return unique table suggestions with aliases', () => {
    const symbols = [
      new TableSymbol('table1', 'alias1'),
      new TableSymbol('table1', 'alias2'),
      new TableSymbol('table2'),
    ];

    const suggestions = getUniqueTableSuggestions(symbols);
    expect(suggestions).toEqual([
      { name: 'table1', alias: 'alias1' },
      { name: 'table1', alias: 'alias2' },
      { name: 'table2' },
    ]);
  });

  it('should return unique table suggestions without aliases', () => {
    const symbols = [new TableSymbol('table1'), new TableSymbol('table2')];

    const suggestions = getUniqueTableSuggestions(symbols);
    expect(suggestions).toEqual([{ name: 'table1' }, { name: 'table2' }]);
  });
});

describe('getTablesFromSymbolTable', () => {
  it('should return table suggestions from the symbol table', () => {
    const mockVisitor = ({
      symbolTable: {
        getNestedSymbolsOfTypeSync: jest
          .fn()
          .mockReturnValue([new TableSymbol('table1', 'alias1'), new TableSymbol('table2')]),
      },
    } as unknown) as SymbolTableVisitor;

    const tables = getTablesFromSymbolTable(mockVisitor);
    expect(tables).toEqual([{ name: 'table1', alias: 'alias1' }, { name: 'table2' }]);
    expect(mockVisitor.symbolTable.getNestedSymbolsOfTypeSync).toHaveBeenCalledWith(TableSymbol);
  });
});

describe('ColumnAliasSymbol', () => {
  it('should create a ColumnAliasSymbol instance', () => {
    const symbol = new ColumnAliasSymbol('columnName', undefined);
    expect(symbol.name).toBe('columnName');
    expect(symbol.type).toBeUndefined();
  });
});

describe('getColumnAliasesFromSymbolTable', () => {
  it('should return column alias suggestions from the symbol table', () => {
    const mockVisitor = ({
      symbolTable: {
        getNestedSymbolsOfTypeSync: jest
          .fn()
          .mockReturnValue([new ColumnAliasSymbol('alias1'), new ColumnAliasSymbol('alias2')]),
      },
    } as unknown) as SymbolTableVisitor;

    const aliases = getColumnAliasesFromSymbolTable(mockVisitor);
    expect(aliases).toEqual([{ name: 'alias1' }, { name: 'alias2' }]);
    expect(mockVisitor.symbolTable.getNestedSymbolsOfTypeSync).toHaveBeenCalledWith(
      ColumnAliasSymbol
    );
  });
});
