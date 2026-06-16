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
   * Insert a WHERE predicate into a SQL query.
   *
   * For a query like `SELECT ... FROM <table> [WHERE x] ...` the predicate is
   * inserted at the table's FROM scope (AND-merged with any existing WHERE).
   *
   * For a query whose FROM is a subquery (e.g. `SELECT * FROM (SELECT ...) AS s`)
   * the predicate is recursively pushed into the innermost simple table reference.
   * This is correct because WHERE evaluates against the underlying scan rows
   * before projection/aliasing, so the predicate's columns are in scope regardless
   * of what the outer SELECT lists project or rename.
   *
   * Returns the input `sql` unchanged when the query cannot be parsed (or contains
   * grammar features not modeled by `OpenSearchSQLParser` such as JOIN, UNION, CTE).
   * Skipping is preferred over a blind append, which would otherwise emit invalid
   * SQL (e.g. `... UNION SELECT ... WHERE ...` only filtering one branch, or
   * `SELECT 1 WHERE ...` with no source).
   */
  public static insertWhereClause(sql: string, whereClause: string): string {
    // The grammar doesn't model JOIN/UNION, so parsing would only cover the
    // first relation and produce invalid SQL. Skip time filtering for these
    // shapes rather than corrupt the query.
    if (/\b(JOIN|UNION)\b/i.test(sql)) return sql;

    const inputStream = CharStream.fromString(sql);
    const lexer = new OpenSearchSQLLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new OpenSearchSQLParser(tokenStream);
    parser.removeErrorListeners();

    const tree = parser.root();
    const selectStmt = tree.sqlStatement()?.dmlStatement()?.selectStatement();
    if (!selectStmt) return sql;

    const querySpec = (selectStmt as any).querySpecification?.();
    if (!querySpec) return sql;

    const target = SQLFilterUtils.findInjectionTarget(querySpec);
    if (!target) return sql;

    const { relation, existingWhere } = target;

    if (existingWhere) {
      const whereToken = existingWhere.start;
      if (!whereToken?.stop) return sql;
      // Position right after the WHERE keyword
      const afterWhereKeyword = whereToken.stop + 1;
      // Position right after the existing WHERE predicate
      const afterWherePredicate = existingWhere.stop?.stop;
      if (afterWherePredicate === undefined) return sql;
      // Wrap the existing predicate in parens to preserve operator precedence
      // (e.g. user's OR shouldn't bind tighter than our AND)
      return (
        sql.slice(0, afterWhereKeyword) +
        ` ${whereClause} AND (` +
        sql.slice(afterWhereKeyword, afterWherePredicate + 1) +
        ')' +
        sql.slice(afterWherePredicate + 1)
      );
    }

    // Insert WHERE right after the relation but before GROUP BY/HAVING/ORDER BY,
    // which the grammar models as siblings of relation inside fromClause.
    const insertPos = relation.stop?.stop;
    if (insertPos === undefined) return sql;
    return sql.slice(0, insertPos + 1) + ` WHERE ${whereClause}` + sql.slice(insertPos + 1);
  }

  /**
   * Walk a parsed `querySpecification` down through `subqueryAsRelation` nodes
   * until we reach a `tableAsRelation` (a simple table reference). Return that
   * relation along with any existing WHERE clause at the same level so the
   * caller can inject or AND-merge there.
   *
   * Returns `null` when the query cannot be reduced to a simple table reference
   * (e.g. JOIN/UNION/CTE shapes that the grammar doesn't model, or relations
   * with neither a `tableName` nor an inner `querySpecification`).
   */
  private static findInjectionTarget(
    querySpec: any
  ): { relation: any; existingWhere?: any } | null {
    const fromClause = querySpec?.fromClause?.();
    if (!fromClause) return null;

    const relation = fromClause.relation?.();
    if (!relation) return null;

    // `tableAsRelation` alternative exposes a `tableName()` accessor.
    if (typeof relation.tableName === 'function' && relation.tableName()) {
      return { relation, existingWhere: fromClause.whereClause?.() };
    }

    // `subqueryAsRelation` alternative wraps an inner `querySpecification`.
    // The grammar labels it `subquery`; depending on the generated bindings
    // this may be exposed as either `subquery()` or `querySpecification()`.
    const innerSpec =
      (typeof relation.subquery === 'function' && relation.subquery()) ||
      (typeof relation.querySpecification === 'function' && relation.querySpecification());
    if (innerSpec) {
      return SQLFilterUtils.findInjectionTarget(innerSpec);
    }

    return null;
  }

  private static addFilterToQuery(query: string, filter: Filter): string {
    const predicate = SQLFilterUtils.toPredicate(filter);
    if (!predicate) return query;
    return SQLFilterUtils.insertWhereClause(query, predicate);
  }

  public static addFiltersToQuery(query: string, filters: Filter[]): string {
    return filters.reduce(SQLFilterUtils.addFilterToQuery, query);
  }
}
