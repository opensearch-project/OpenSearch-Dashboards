/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Filter, formatTimePickerDate, getFilterField, TimeRange } from '../../../../data/common';
import { formatDate } from '../../../common';

/**
 * Parse core {@link Filter} and convert to a PPL where clause. Only supports
 * non DSL filters.
 */
export const convertFiltersToClause = (filters?: Filter[]): string => {
  if (!filters) return '';
  const predicates = filters
    .filter((filter) => !filter.meta.disabled)
    .map(toPredicate)
    .filter(Boolean);
  const predicate = (predicates.length > 1 ? predicates.map((p) => `(${p})`) : predicates).join(
    ' AND '
  );
  return predicate ? 'WHERE ' + predicate : '';
};

const escapeQuotes = (value: string) => value.replaceAll("'", "''");

const toPredicate = (filter: Filter): string => {
  const meta = filter.meta;
  // SQL/PPL does not accept .keyword and will automatically append it
  const field = getFilterField(filter).replace(/.keyword$/, '');
  if (!meta.negate) {
    switch (meta.type) {
      case 'phrase':
        return `\`${field}\` = '${escapeQuotes(meta.params.query)}'`;
      case 'phrases':
        return meta.params
          .map((query: string) => `\`${field}\` = '${escapeQuotes(query)}'`)
          .join(' OR ');
      case 'range':
        const ranges = [];
        if (meta.params.gte != null) ranges.push(`\`${field}\` >= ${meta.params.gte}`);
        if (meta.params.lt != null) ranges.push(`\`${field}\` < ${meta.params.lt}`);
        return ranges.join(' AND ');
      case 'exists':
        return `ISNOTNULL(\`${field}\`)`;
    }
  } else {
    switch (meta.type) {
      case 'phrase':
        return `\`${field}\` != '${escapeQuotes(meta.params.query)}'`;
      case 'phrases':
        return meta.params
          .map((query: string) => `\`${field}\` != '${escapeQuotes(query)}'`)
          .join(' AND ');
      case 'range':
        const ranges = [];
        if (meta.params.gte != null) ranges.push(`\`${field}\` < ${meta.params.gte}`);
        if (meta.params.lt != null) ranges.push(`\`${field}\` >= ${meta.params.lt}`);
        return ranges.join(' OR ');
      case 'exists':
        return `ISNULL(\`${field}\`)`;
    }
  }
  return '';
};

/**
 * Get time filter command for PPL query
 * @param timeFieldName Time field name
 * @param timeRange Time range from the time picker
 * @returns PPL where command with time range filter
 */
export const getTimeFilterClause = (timeFieldName: string, timeRange: TimeRange) => {
  const { fromDate, toDate } = formatTimePickerDate(timeRange, 'YYYY-MM-DD HH:mm:ss.SSS');
  return `WHERE \`${timeFieldName}\` >= '${formatDate(
    fromDate
  )}' AND \`${timeFieldName}\` <= '${formatDate(toDate)}'`;
};
