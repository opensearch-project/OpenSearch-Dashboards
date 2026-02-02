/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as antlr from 'antlr4ng';
import {
  SimplifiedOpenSearchPPLLexer as OpenSearchPPLLexer,
  SimplifiedOpenSearchPPLParser as OpenSearchPPLParser,
  SimplifiedOpenSearchPPLParserVisitor,
} from '@osd/antlr-grammar';
import { IFieldType } from '../../../../common/index_patterns/fields/types';

export interface SymbolTableState {
  availableFields: Set<IFieldType>;
  errors: string[];
}

/**
 * PPL Symbol Table Parser - tracks available column names through PPL command pipeline
 *
 * This parser walks through PPL commands and maintains a symbol table of available fields:
 * - Starts with initial field list (from index pattern or data source)
 * - fields command: filters to only selected fields
 * - rename command: updates field names and mappings
 * - stats command: replaces fields with aggregation results or grouping fields
 * - eval command: adds calculated fields
 */
export class PPLSymbolTableParser extends SimplifiedOpenSearchPPLParserVisitor<SymbolTableState> {
  private symbolTable: SymbolTableState = {
    availableFields: new Set(),
    errors: [],
  };
  private initialFields: IFieldType[];

  constructor(initialFields: IFieldType[] = []) {
    super();
    this.initialFields = initialFields;
    this.resetSymbolTable();
  }

  private resetSymbolTable(): void {
    this.symbolTable = {
      availableFields: new Set(this.initialFields),
      errors: [],
    };
  }

  /**
   * Parse PPL query and return final symbol table state
   */
  public parseQuery(pplQuery: string): SymbolTableState {
    try {
      this.resetSymbolTable();

      const inputStream = antlr.CharStream.fromString(pplQuery);
      const lexer = new OpenSearchPPLLexer(inputStream);
      const tokenStream = new antlr.CommonTokenStream(lexer);
      const parser = new OpenSearchPPLParser(tokenStream);

      const tree = parser.root();
      this.visit(tree);

      return this.symbolTable;
    } catch (error) {
      return {
        availableFields: new Set(this.initialFields),
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Get current available field objects as array
   */
  public getAvailableFields(): IFieldType[] {
    return Array.from(this.symbolTable.availableFields);
  }

  /**
   * Visit fields command: fields field1, field2, ...
   */
  visitFieldsCommand = (ctx: any): SymbolTableState => {
    try {
      const fieldBodyContext = ctx.fieldsCommandBody().wcFieldList();
      const fieldList = this.extractWcFieldList(fieldBodyContext);
      if (fieldList.length > 0) {
        const hasMinus = ctx.fieldsCommandBody().MINUS() !== null;

        if (hasMinus) {
          fieldList.forEach((fieldName) => {
            // Find and remove field objects by name
            const fieldToRemove = Array.from(this.symbolTable.availableFields).find(
              (f) => f.name === fieldName
            );
            if (fieldToRemove) {
              this.symbolTable.availableFields.delete(fieldToRemove);
            }
          });
        } else {
          const newAvailableFields = new Set<IFieldType>();

          fieldList.forEach((fieldName) => {
            const fieldObj = Array.from(this.symbolTable.availableFields).find(
              (f) => f.name === fieldName
            );
            if (fieldObj) {
              newAvailableFields.add(fieldObj);
            }
          });

          this.symbolTable.availableFields = newAvailableFields;
        }
      }
    } catch (error) {
      this.symbolTable.errors.push(`Error processing fields command: ${error}`);
    }

    return this.symbolTable;
  };

  /**
   * Visit rename command: rename old_field as new_field, ...
   */
  visitRenameCommand = (ctx: any): SymbolTableState => {
    try {
      const renameClauses = ctx.renameClasue();

      if (renameClauses) {
        const clauses = Array.isArray(renameClauses) ? renameClauses : [renameClauses];

        clauses.forEach((clause: any) => {
          // In rename clause, orignalField and renamedField are wcFieldExpression contexts
          const originalFieldName = this.extractFieldName(clause._orignalField);
          const newFieldName = this.extractFieldName(clause._renamedField);

          const originalFieldObj = Array.from(this.symbolTable.availableFields).find(
            (f) => f.name === originalFieldName
          );
          if (originalFieldObj) {
            this.symbolTable.availableFields.delete(originalFieldObj);

            // Create new field object with the new name
            const newFieldObj: IFieldType = {
              ...originalFieldObj,
              name: newFieldName,
              displayName: newFieldName,
            };

            this.symbolTable.availableFields.add(newFieldObj);
          }
        });
      }
    } catch (error) {
      this.symbolTable.errors.push(`Error processing rename command: ${error}`);
    }

    return this.symbolTable;
  };

  /**
   * Visit stats command: stats agg_func(field) [as alias] [by group_fields]
   */
  visitStatsCommand = (ctx: any): SymbolTableState => {
    try {
      const newAvailableFields = new Set<IFieldType>();

      // Process aggregation terms
      const statsAggTerms = ctx.statsAggTerm();
      if (statsAggTerms) {
        const aggTerms = Array.isArray(statsAggTerms) ? statsAggTerms : [statsAggTerms];

        aggTerms.forEach((term: any) => {
          let fieldName: string;

          if (term._alias) {
            fieldName = this.extractFieldName(term._alias);
            // Create a calculated field object
            const calculatedField: IFieldType = {
              name: fieldName,
              type: 'number', // Stats usually return numbers
              esTypes: ['long', 'double'],
              aggregatable: true,
              filterable: true,
              searchable: false,
              sortable: true,
              visualizable: true,
              readFromDocValues: false,
              scripted: true,
              displayName: fieldName,
            };
            newAvailableFields.add(calculatedField);
          }
        });
      }

      // Process BY clause (grouping fields)
      const statsByClause = ctx.statsByClause();
      if (statsByClause) {
        const groupFieldNames = this.extractGroupByFields(statsByClause);
        groupFieldNames.forEach((fieldName) => {
          const fieldObj = Array.from(this.symbolTable.availableFields).find(
            (f) => f.name === fieldName
          );
          if (fieldObj) {
            newAvailableFields.add(fieldObj);
          }
        });
      }
      if (newAvailableFields.size > 0) {
        // Only update the newAvailableFields if we have newFields
        this.symbolTable.availableFields = newAvailableFields;
      }
    } catch (error) {
      this.symbolTable.errors.push(`Error processing stats command: ${error}`);
    }

    return this.symbolTable;
  };

  /**
   * Visit eval command: eval new_field = expression, ...
   */
  visitEvalCommand = (ctx: any): SymbolTableState => {
    try {
      const evalClauses = ctx.evalClause();

      if (evalClauses) {
        const clauses = Array.isArray(evalClauses) ? evalClauses : [evalClauses];

        clauses.forEach((clause: any) => {
          const fieldName = this.extractFieldName(clause.fieldExpression());

          // Create a calculated field object
          const calculatedField: IFieldType = {
            name: fieldName,
            type: 'unknown', // Type will be determined at runtime
            esTypes: ['keyword'],
            aggregatable: false,
            filterable: true,
            searchable: true,
            sortable: false,
            visualizable: false,
            readFromDocValues: false,
            scripted: true,
            displayName: fieldName,
          };

          this.symbolTable.availableFields.add(calculatedField);
        });
      }
    } catch (error) {
      this.symbolTable.errors.push(`Error processing eval command: ${error}`);
    }

    return this.symbolTable;
  };

  // Helper methods for extracting information from parse tree

  private extractFieldList(fieldListCtx: any): string[] {
    if (!fieldListCtx) return [];

    try {
      // Get field expressions using ANTLR's generated method
      const fieldExpressions = fieldListCtx.fieldExpression();
      if (!fieldExpressions) return [];

      // Handle both single expression and array of expressions
      const expressions = Array.isArray(fieldExpressions) ? fieldExpressions : [fieldExpressions];

      // Extract field names using ANTLR's getText() method
      return expressions
        .map((expr: any) => this.extractFieldName(expr))
        .filter((name: string) => name.length > 0);
    } catch (error) {
      return [];
    }
  }

  private extractWcFieldList(wcFieldListCtx: any): string[] {
    if (!wcFieldListCtx) return [];

    try {
      // Get select field expressions using ANTLR's generated method
      const selectFieldExpressions = wcFieldListCtx.selectFieldExpression();
      if (!selectFieldExpressions) return [];

      // Handle both single expression and array of expressions
      const expressions = Array.isArray(selectFieldExpressions)
        ? selectFieldExpressions
        : [selectFieldExpressions];

      // Extract field names using ANTLR's getText() method
      return expressions
        .map((expr: any) => this.extractFieldName(expr))
        .filter((name: string) => name.length > 0);
    } catch (error) {
      return [];
    }
  }

  private extractFieldName(fieldExpr: any): string {
    if (!fieldExpr) return '';

    // Use ANTLR's built-in getText() method which handles all context types
    // and automatically traverses the parse tree to get the complete text
    const text = fieldExpr.getText();
    if (!text) return '';

    // Clean up common SQL/PPL field name decorations
    return text
      .replace(/^[`"'\s]+|[`"'\s]+$/g, '') // Remove quotes, backticks, and whitespace
      .trim();
  }

  private extractGroupByFields(statsByClause: any): string[] {
    if (!statsByClause) return [];

    try {
      const fields: string[] = [];

      // Handle different forms of statsByClause based on updated grammar:
      // BY fieldList
      // BY bySpanClause
      // BY bySpanClause COMMA fieldList
      // BY fieldList COMMA bySpanClause

      // Check for fieldList (can be standalone or combined with bySpanClause)
      const fieldListContext = statsByClause.fieldList();
      if (fieldListContext) {
        const fieldListResults = this.extractFieldList(fieldListContext);
        fields.push(...fieldListResults);
      }

      // Check for bySpanClause (can be standalone or combined with fieldList)
      const bySpanClauseContext = statsByClause.bySpanClause();
      if (bySpanClauseContext) {
        // Check if there's an alias (AS alias) - using _alias property from grammar
        const aliasContext = bySpanClauseContext._alias || bySpanClauseContext.qualifiedName();
        if (aliasContext) {
          fields.push(this.extractFieldName(aliasContext));
        } else {
          // Extract field name from spanClause fieldExpression
          const spanClauseContext = bySpanClauseContext.spanClause();
          if (spanClauseContext) {
            const fieldExpressionContext = spanClauseContext.fieldExpression();
            if (fieldExpressionContext) {
              fields.push(this.extractFieldName(fieldExpressionContext));
            }
          }
        }
      }

      return fields;
    } catch (error) {
      return [];
    }
  }

  protected defaultResult(): SymbolTableState {
    return this.symbolTable;
  }
}

/**
 * Utility function to create and use PPL Symbol Table Parser
 */
export function parsePPLSymbolTable(
  pplQuery: string,
  initialFields: IFieldType[] = []
): SymbolTableState {
  const parser = new PPLSymbolTableParser(initialFields);
  return parser.parseQuery(pplQuery);
}

/**
 * Utility function to get available fields from PPL query
 */
export function getAvailableFieldsFromPPL(
  pplQuery: string,
  initialFields: IFieldType[] = [],
  filterMethod?: (field: IFieldType) => boolean
): IFieldType[] {
  const symbolTable = parsePPLSymbolTable(pplQuery, initialFields);
  const availableFields = Array.from(symbolTable.availableFields);
  return filterMethod ? availableFields.filter(filterMethod) : availableFields;
}

/**
 * Get available fields for autocompletion at cursor position
 * This analyzes the PPL query up to the cursor position to determine what fields should be suggested
 */
export function getAvailableFieldsForAutocomplete(
  fullQuery: string,
  cursorPosition: number,
  initialFields: IFieldType[] = [],
  filterMethod?: (field: IFieldType) => boolean
): IFieldType[] {
  try {
    // Extract the query up to cursor position
    const queryToCursor = fullQuery.substring(0, cursorPosition);

    // Find the last complete command before cursor
    const lastPipeIndex = queryToCursor.lastIndexOf('|');

    let queryToAnalyze: string;
    if (lastPipeIndex === -1) {
      // No pipes found, analyze from beginning
      queryToAnalyze = queryToCursor.trim();
    } else {
      // Analyze up to the last complete command
      queryToAnalyze = queryToCursor.substring(0, lastPipeIndex).trim();
    }

    if (!queryToAnalyze) {
      // No complete commands yet, return all initial fields
      return filterMethod ? initialFields.filter(filterMethod) : initialFields;
    }

    return getAvailableFieldsFromPPL(queryToAnalyze, initialFields, filterMethod);
  } catch (error) {
    // On error, return initial fields as fallback
    return filterMethod ? initialFields.filter(filterMethod) : initialFields;
  }
}
