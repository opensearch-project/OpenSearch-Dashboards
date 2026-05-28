/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Filter } from '../../../../data/common';
import { FilterUtils } from './filter_utils';

export class SQLFilterUtils extends FilterUtils {
  /**
   * Wrap user SQL with a CTE that shadows the dataset's table with a filtered
   * version. Returns `sql` unchanged when the user already has a CTE with the
   * same name (collision risk). Requires CTE support in the target engine.
   */
  public static wrapWithTimeFilterCTE(sql: string, tableName: string, whereClause: string): string {
    if (!tableName) return sql;

    // Only wrap SELECT/WITH queries. Other statements (SHOW, DESCRIBE, EXPLAIN,
    // etc.) don't accept a CTE prefix and would be broken by our wrap. Allow
    // line/block comments and whitespace before the keyword.
    const wrappablePrefixRe = /^(?:\s|--[^\n]*\n?|\/\*[\s\S]*?\*\/)*(?:SELECT|WITH)\b/i;
    if (!wrappablePrefixRe.test(sql)) return sql;

    const escapedName = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const collisionRe = new RegExp(`\\bWITH\\b[\\s\\S]*?\\b${escapedName}\\b\\s+AS\\s*\\(`, 'i');
    if (collisionRe.test(sql)) return sql;

    const ourCte = `\`${tableName}\` AS (SELECT * FROM \`${tableName}\` WHERE ${whereClause})`;

    // Detect a leading WITH, allowing line/block comments and whitespace before
    // it. This way `-- some comment\nWITH foo AS (...)` still triggers a merge
    // instead of producing two WITH clauses.
    const leadingPrefixRe = /^(?:\s|--[^\n]*\n?|\/\*[\s\S]*?\*\/)*WITH\b/i;
    if (leadingPrefixRe.test(sql)) {
      // Insert our CTE right after the user's `WITH` keyword.
      const withRe = /\bWITH\b/i;
      return sql.replace(withRe, `WITH ${ourCte},`);
    }
    return `WITH ${ourCte} ${sql}`;
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
