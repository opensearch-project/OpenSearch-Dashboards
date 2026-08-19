/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { parsePromQL } from '../promql_builder';
import type { BuilderState } from '../promql_builder';
import { splitMultiQueries } from '../../../utils/multi_query_utils';
import { PerQueryOptions } from '../../../utils/languages';

export type RowMode = 'builder' | 'code';

export interface QueryRow {
  id: string;
  mode: RowMode;
  query: string;
  builderState: BuilderState | null;
  minStep?: string;
  legendFormat?: string;
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

export function initRows(
  queryString: string,
  nextId: () => string,
  perQueryOptions?: PerQueryOptions[]
): QueryRow[] {
  const parsed = splitMultiQueries(queryString);
  if (parsed.length === 0) {
    const result = parsePromQL('');
    return [
      {
        id: nextId(),
        mode: 'builder',
        query: '',
        builderState: result.state,
        minStep: perQueryOptions?.[0]?.minStep,
        legendFormat: perQueryOptions?.[0]?.legendFormat,
      },
    ];
  }
  return parsed.map((pq: { query: string }, index: number) => {
    const result = parsePromQL(pq.query);
    return {
      id: nextId(),
      mode: result.canBuild ? 'builder' : 'code',
      query: pq.query,
      builderState: result.canBuild ? result.state : null,
      minStep: perQueryOptions?.[index]?.minStep,
      legendFormat: perQueryOptions?.[index]?.legendFormat,
    };
  });
}

function activeRows(rows: QueryRow[]): QueryRow[] {
  return rows.filter((r) => r.query.trim());
}

export function joinRows(rows: QueryRow[]): string {
  const queries = activeRows(rows).map((r) => r.query);
  if (queries.length <= 1) return queries[0] || '';
  return queries.map((q) => `${q};`).join('\n');
}

export function serializeRows(rows: QueryRow[]): {
  query: string;
  perQueryOptions: PerQueryOptions[];
} {
  const active = activeRows(rows);
  return {
    query: joinRows(rows),
    perQueryOptions: active.map((r) => ({ minStep: r.minStep, legendFormat: r.legendFormat })),
  };
}
