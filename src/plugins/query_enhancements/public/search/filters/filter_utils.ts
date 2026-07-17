/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Filter,
  filterMatchesIndex,
  formatTimePickerDate,
  getDataSourceEngineCapabilities,
  getFilterField,
  IIndexPattern,
  isFilterDisabled,
  TimeRange,
} from '../../../../data/common';
import { formatDate } from '../../../common';

export class FilterUtils {
  /**
   * Get time filter where clause
   * @param timeFieldName Time field name
   * @param timeRange Time range from the time picker
   * @param engineType Engine type of the target data source (`engineType ?? type`), used to decide
   *   whether the time literals need to be wrapped in `TIMESTAMP('...')`.
   * @returns where clause of the time range filter
   *
   * Legacy Elasticsearch (Open Distro) PPL does NOT coerce a string to a timestamp for
   * `field >= '<string>'` and rejects it with a [TIMESTAMP,STRING] type error, so those engines need
   * the explicit `TIMESTAMP('...')` wrapper. OpenSearch PPL, however, folds a bare-string comparison
   * into a native Lucene `range` query, whereas `TIMESTAMP('...')` (a function call on the RHS) forces
   * a per-value `opensearch_query_expression` script filter — each unique timestamp compiles a new
   * script and quickly trips the cluster's script-compilation rate limit
   * (`script.context.filter.max_compilations_rate`, default 75/5m). So we only wrap for engines that
   * require it (`usesOpenDistroSqlPpl`), keeping OpenSearch on the native, script-free range query.
   */
  public static getTimeFilterWhereClause(
    timeFieldName: string,
    timeRange: TimeRange,
    engineType?: string
  ): string {
    const { fromDate, toDate } = formatTimePickerDate(timeRange, 'YYYY-MM-DD HH:mm:ss.SSS');
    const wrap = getDataSourceEngineCapabilities(engineType).usesOpenDistroSqlPpl
      ? (literal: string) => `TIMESTAMP('${literal}')`
      : (literal: string) => `'${literal}'`;
    return `WHERE \`${timeFieldName}\` >= ${wrap(formatDate(fromDate))} AND \`${timeFieldName}\` <= ${wrap(
      formatDate(toDate)
    )}`;
  }

  /**
   * Convert core {@link Filter} and convert to a PPL where clause. Only
   * supports non DSL filters.
   */
  public static convertFiltersToWhereClause(
    filters: Filter[],
    indexPattern: IIndexPattern | undefined,
    ignoreFilterIfFieldNotInIndex: boolean = false
  ): string {
    if (!filters) return '';
    const predicates = filters
      .filter((filter) => filter && !isFilterDisabled(filter))
      .filter(
        (filter) => !ignoreFilterIfFieldNotInIndex || filterMatchesIndex(filter, indexPattern)
      )
      .map(FilterUtils.toPredicate)
      .filter(Boolean);
    const predicate = (predicates.length > 1 ? predicates.map((p) => `(${p})`) : predicates).join(
      ' AND '
    );
    return predicate ? 'WHERE ' + predicate : '';
  }

  public static toPredicate(filter: Filter): string | undefined {
    const meta = filter.meta;
    // SQL/PPL does not accept .keyword and will automatically append it if needed
    const field = getFilterField(filter)?.replace(/.keyword$/, '');
    if (!field) return;
    if (!meta.negate) {
      switch (meta.type) {
        case 'phrase':
          return `\`${field}\` = ${FilterUtils.quote(meta.params.query)}`;
        case 'phrases':
          return meta.params
            .map((query: string) => `\`${field}\` = ${FilterUtils.quote(query)}`)
            .join(' OR ');
        case 'range':
          const ranges = [];
          if (meta.params.gte != null) ranges.push(`\`${field}\` >= ${meta.params.gte}`);
          if (meta.params.lt != null) ranges.push(`\`${field}\` < ${meta.params.lt}`);
          return ranges.join(' AND ');
        case 'exists':
          return `ISNOTNULL(\`${field}\`)`;
      }
      if (filter.query) {
        if (filter.query.match_phrase && field in filter.query.match_phrase) {
          return `\`${field}\` = ${FilterUtils.quote(filter.query.match_phrase[field])}`;
        }
      }
    } else {
      switch (meta.type) {
        case 'phrase':
          return `\`${field}\` != ${FilterUtils.quote(meta.params.query)}`;
        case 'phrases':
          return meta.params
            .map((query: string) => `\`${field}\` != ${FilterUtils.quote(query)}`)
            .join(' AND ');
        case 'range':
          const ranges = [];
          if (meta.params.gte != null) ranges.push(`\`${field}\` < ${meta.params.gte}`);
          if (meta.params.lt != null) ranges.push(`\`${field}\` >= ${meta.params.lt}`);
          return ranges.join(' OR ');
        case 'exists':
          return `ISNULL(\`${field}\`)`;
      }
      if (filter.query) {
        if (filter.query.match_phrase && field in filter.query.match_phrase) {
          return `\`${field}\` != ${FilterUtils.quote(filter.query.match_phrase[field])}`;
        }
      }
    }
  }

  protected static quote(value: unknown) {
    if (typeof value === 'string') return `'${value.replaceAll("'", "''")}'`;
    return value;
  }
}
