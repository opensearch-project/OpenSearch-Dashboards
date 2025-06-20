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
import { FieldsCommandContext } from 'packages/osd-antlr-grammar/target/opensearch_ppl/.generated/OpenSearchPPLParser';

export interface FieldInfo {
  name: string;
  originalName?: string;
  isCalculated?: boolean;
  expression?: string;
}

export interface SymbolTableState {
  availableFields: Set<string>;
  fieldMappings: Map<string, FieldInfo>;
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
    fieldMappings: new Map(),
    errors: [],
  };
  private initialFields: string[];

  constructor(initialFields: string[] = []) {
    super();
    this.initialFields = initialFields;
    this.resetSymbolTable();
  }

  private resetSymbolTable(): void {
    this.symbolTable = {
      availableFields: new Set(this.initialFields),
      fieldMappings: new Map(),
      errors: [],
    };

    this.initialFields.forEach((field) => {
      this.symbolTable.fieldMappings.set(field, { name: field });
    });
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
        fieldMappings: new Map(),
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Get current available field names as array
   */
  public getAvailableFields(): string[] {
    return Array.from(this.symbolTable.availableFields);
  }

  /**
   * Get field info by current name
   */
  public getFieldInfo(fieldName: string): FieldInfo | undefined {
    return this.symbolTable.fieldMappings.get(fieldName);
  }

  /**
   * Visit fields command: fields field1, field2, ...
   */
  visitFieldsCommand = (ctx: any): SymbolTableState => {
    try {
      const fieldList = this.extractFieldList(ctx.fieldList());

      if (fieldList.length > 0) {
        const hasMinus = ctx.MINUS() !== null;

        if (hasMinus) {
          fieldList.forEach((field) => {
            this.symbolTable.availableFields.delete(field);
            this.symbolTable.fieldMappings.delete(field);
          });
        } else {
          const newAvailableFields = new Set<string>();
          const newFieldMappings = new Map<string, FieldInfo>();

          fieldList.forEach((field) => {
            if (this.symbolTable.availableFields.has(field)) {
              newAvailableFields.add(field);
              const fieldInfo = this.symbolTable.fieldMappings.get(field);
              if (fieldInfo) {
                newFieldMappings.set(field, fieldInfo);
              }
            }
          });

          this.symbolTable.availableFields = newAvailableFields;
          this.symbolTable.fieldMappings = newFieldMappings;
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
          const originalField = this.extractFieldName(clause._orignalField);
          const newField = this.extractFieldName(clause._renamedField);

          if (this.symbolTable.availableFields.has(originalField)) {
            this.symbolTable.availableFields.delete(originalField);
            const originalFieldInfo = this.symbolTable.fieldMappings.get(originalField);
            this.symbolTable.fieldMappings.delete(originalField);

            this.symbolTable.availableFields.add(newField);
            this.symbolTable.fieldMappings.set(newField, {
              name: newField,
              originalName: originalFieldInfo?.originalName || originalField,
            });
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
      const newAvailableFields = new Set<string>();
      const newFieldMappings = new Map<string, FieldInfo>();

      // Process aggregation terms
      const statsAggTerms = ctx.statsAggTerm();
      if (statsAggTerms) {
        const aggTerms = Array.isArray(statsAggTerms) ? statsAggTerms : [statsAggTerms];

        aggTerms.forEach((term: any) => {
          let fieldName: string;

          if (term._alias) {
            fieldName = this.extractFieldName(term._alias);
            newAvailableFields.add(fieldName);
            newFieldMappings.set(fieldName, {
              name: fieldName,
              isCalculated: true,
              expression: this.extractStatsExpression(term),
            });
          }
        });
      }

      // Process BY clause (grouping fields)
      const statsByClause = ctx.statsByClause();
      if (statsByClause) {
        const groupFields = this.extractGroupByFields(statsByClause);
        groupFields.forEach((field) => {
          if (this.symbolTable.availableFields.has(field)) {
            newAvailableFields.add(field);
            const originalFieldInfo = this.symbolTable.fieldMappings.get(field);
            if (originalFieldInfo) {
              newFieldMappings.set(field, originalFieldInfo);
            }
          }
        });
      }
      if (newAvailableFields) {
        // Only update the newAvailableFields if we have newFields
        this.symbolTable.availableFields = newAvailableFields;
        this.symbolTable.fieldMappings = newFieldMappings;
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
          const expression = this.extractExpression(clause.expression());

          this.symbolTable.availableFields.add(fieldName);
          this.symbolTable.fieldMappings.set(fieldName, {
            name: fieldName,
            isCalculated: true,
            expression,
          });
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

      if (statsByClause.fieldList && statsByClause.fieldList()) {
        return this.extractFieldList(statsByClause.fieldList());
      }

      if (statsByClause.bySpanClause && statsByClause.bySpanClause()) {
        const spanClause = statsByClause.bySpanClause();
        if (spanClause.alias) {
          fields.push(this.extractFieldName(spanClause.alias));
        } else if (spanClause.spanClause && spanClause.spanClause().fieldExpression) {
          fields.push(this.extractFieldName(spanClause.spanClause().fieldExpression()));
        }
      }

      return fields;
    } catch (error) {
      return [];
    }
  }

  private extractStatsExpression(statsAggTerm: any): string {
    try {
      return statsAggTerm.getText() || '';
    } catch (error) {
      return '';
    }
  }

  private extractExpression(expressionCtx: any): string {
    try {
      return expressionCtx.getText() || '';
    } catch (error) {
      return '';
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
  initialFields: string[] = []
): SymbolTableState {
  const parser = new PPLSymbolTableParser(initialFields);
  return parser.parseQuery(pplQuery);
}

/**
 * Utility function to get available fields from PPL query
 */
export function getAvailableFieldsFromPPL(
  pplQuery: string,
  initialFields: string[] = []
): string[] {
  const symbolTable = parsePPLSymbolTable(pplQuery, initialFields);
  return Array.from(symbolTable.availableFields);
}

/**
 * Get available fields for autocompletion at cursor position
 * This analyzes the PPL query up to the cursor position to determine what fields should be suggested
 */
export function getAvailableFieldsForAutocomplete(
  fullQuery: string,
  cursorPosition: number,
  initialFields: string[] = []
): string[] {
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
      return initialFields;
    }

    return getAvailableFieldsFromPPL(queryToAnalyze, initialFields);
  } catch (error) {
    // On error, return initial fields as fallback
    return initialFields;
  }
}
