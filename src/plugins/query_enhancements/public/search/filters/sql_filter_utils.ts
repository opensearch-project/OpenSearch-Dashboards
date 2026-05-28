/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream } from 'antlr4ng';
import { OpenSearchSQLLexer, OpenSearchSQLParser } from '@osd/antlr-grammar';
import { Filter } from '../../../../data/common';
import { FilterUtils } from './filter_utils';

export class SQLFilterUtils extends FilterUtils {
  /**
   * Insert time filter WHERE clause into user SQL using ANTLR parsing.
   * Returns `sql` unchanged if parsing fails or insertion is unsafe.
   */
  public static insertWhereClause(sql: string, tableName: string, whereClause: string): string {
    if (!tableName) return sql;

    try {
      // Use ANTLR to parse the SQL and find WHERE insertion point

      const inputStream = CharStream.fromString(sql);
      const lexer = new OpenSearchSQLLexer(inputStream);
      const tokenStream = new CommonTokenStream(lexer);
      const parser = new OpenSearchSQLParser(tokenStream);
      const tree = parser.root();

      // Navigate to the SELECT statement and find FROM clause
      const selectStatement = tree.sqlStatement()?.selectStatement();
      if (!selectStatement) return sql; // Not a SELECT statement, skip filtering

      const fromClause = selectStatement.fromClause();
      if (!fromClause || !fromClause.relation()) return sql;

      const relation = fromClause.relation();
      const insertPos = relation.stop!.stop! + 1;

      // Check if WHERE clause already exists
      const existingWhereClause = selectStatement.whereClause();
      if (existingWhereClause) {
        // Add to existing WHERE with proper OR precedence handling
        const existingWhere = existingWhereClause.expression();
        const existingWhereText = sql.slice(
          existingWhere.start!.start!,
          existingWhere.stop!.stop! + 1
        );
        const wrappedExisting = `(${existingWhereText})`;
        const newWhereText = `(${whereClause}) AND ${wrappedExisting}`;

        return (
          sql.slice(0, existingWhere.start!.start!) +
          newWhereText +
          sql.slice(existingWhere.stop!.stop! + 1)
        );
      } else {
        // Insert new WHERE clause
        return sql.slice(0, insertPos) + ` WHERE ${whereClause}` + sql.slice(insertPos);
      }
    } catch (error) {
      // If ANTLR parsing fails, return original query unchanged (no time filter)
      // This ensures we never break a working query
      return sql;
    }
  }

  /**
   * Wrap user SQL in an outer SELECT that applies the predicate to the user's
   * projected results. Works for any SQL shape the engine accepts; relies on
   * the optimizer to push the predicate down through the wrap when possible.
   */
  public static wrapWithFilter(sql: string, predicate: string): string {
    return `SELECT * FROM (${sql}) AS _wrap WHERE ${predicate}`;
  }

  public static addFiltersToQuery(query: string, filters: Filter[]): string {
    const predicates = filters
      .map(SQLFilterUtils.toPredicate)
      .filter((p): p is string => Boolean(p));
    if (predicates.length === 0) return query;
    const combined =
      predicates.length === 1 ? predicates[0] : predicates.map((p) => `(${p})`).join(' AND ');
    return SQLFilterUtils.wrapWithFilter(query, combined);
  }
}
