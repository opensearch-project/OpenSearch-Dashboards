/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { parsePromQL } from '../promql_builder';
import type { BuilderState } from '../promql_builder';
import { splitMultiQueries } from '../../../utils/multi_query_utils';

export type RowMode = 'builder' | 'code';

export interface QueryRow {
  id: string;
  mode: RowMode;
  query: string;
  builderState: BuilderState | null;
}

export const modeButtons = [
  {
    id: 'builder',
    label: i18n.translate('explore.metricsQueryPanel.builderMode', { defaultMessage: 'Builder' }),
  },
  {
    id: 'code',
    label: i18n.translate('explore.metricsQueryPanel.codeMode', { defaultMessage: 'Code' }),
  },
];

export function initRows(queryString: string, nextId: () => string): QueryRow[] {
  const parsed = splitMultiQueries(queryString);
  if (parsed.length === 0) {
    const result = parsePromQL('');
    return [{ id: nextId(), mode: 'builder', query: '', builderState: result.state }];
  }
  return parsed.map((pq: { query: string }) => {
    const result = parsePromQL(pq.query);
    return {
      id: nextId(),
      mode: result.canBuild ? 'builder' : 'code',
      query: pq.query,
      builderState: result.canBuild ? result.state : null,
    };
  });
}

export function joinRows(rows: QueryRow[]): string {
  const queries = rows.map((r) => r.query).filter((q) => q.trim());
  if (queries.length <= 1) return queries[0] || '';
  return queries.map((q) => `${q};`).join('\n');
}
