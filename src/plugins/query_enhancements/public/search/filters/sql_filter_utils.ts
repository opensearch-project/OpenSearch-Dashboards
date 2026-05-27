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

    const escapedName = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const collisionRe = new RegExp(`\\bWITH\\b[\\s\\S]*?\\b${escapedName}\\b\\s+AS\\s*\\(`, 'i');
    if (collisionRe.test(sql)) return sql;

    const ourCte = `\`${tableName}\` AS (SELECT * FROM \`${tableName}\` WHERE ${whereClause})`;
    const leadingWithRe = /^(\s*)WITH(\s+)/i;
    if (leadingWithRe.test(sql)) {
      return sql.replace(leadingWithRe, `$1WITH$2${ourCte},$2`);
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
