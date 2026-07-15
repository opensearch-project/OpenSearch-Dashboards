/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset, DEFAULT_DATA, formatTimePickerDate } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';

export interface PreviewRow {
  [field: string]: unknown;
}

export interface PreviewResult {
  columns: string[];
  rows: PreviewRow[];
}

export const DEFAULT_PREVIEW_SIZE = 10;
export const EXPANDED_PREVIEW_SIZE = 100;

// The query-enhancements PPL search route (BASE_API `/api/enhancements/search` + strategy `ppl`).
const SEARCH_STRATEGY_PPL = 'ppl';

/**
 * The same time-range WHERE clause the histogram uses (and the production query-enhancements PPL
 * path). `TIMESTAMP('...')` literals are portable across modern and legacy PPL engines. Our isolated
 * `http.post` bypasses the search interceptor that would normally inject this, so we add it here to
 * bound the preview to the picked time range — keeping the log lines consistent with the histogram.
 */
const timeWhereClause = (timeFieldName: string, from: number, to: number): string => {
  const { fromDate, toDate } = formatTimePickerDate(
    { from: new Date(from).toISOString(), to: new Date(to).toISOString() },
    'YYYY-MM-DD HH:mm:ss.SSS'
  );
  return `where \`${timeFieldName}\` >= TIMESTAMP('${fromDate}') and \`${timeFieldName}\` <= TIMESTAMP('${toDate}')`;
};

interface FetchPreviewArgs {
  indexName: string;
  timeFieldName?: string;
  dataSource?: Dataset['dataSource'];
  size?: number;
  /** Global time range bounds (epoch ms). When present with a time field, the preview is bounded to
   *  this range — so the log lines match the histogram instead of showing the latest docs ever. */
  from?: number;
  to?: number;
}

/**
 * Runs a one-off, isolated PPL preview for an index — the latest `size` docs, as raw rows. Abortable
 * via `signal`, so a viewport-gated stack of cards can cancel scrolled-away fetches. Isolated from the
 * Redux results slice: it POSTs directly to the PPL enhancements route and returns local data.
 */
export const fetchPreview = async (
  services: ExploreServices,
  { indexName, timeFieldName, dataSource, size = DEFAULT_PREVIEW_SIZE, from, to }: FetchPreviewArgs,
  signal?: AbortSignal
): Promise<PreviewResult> => {
  const previewDataset: Dataset = {
    id: `logs-explore-preview::${dataSource?.id ?? ''}::${indexName}`,
    title: indexName,
    type: DEFAULT_DATA.SET_TYPES.INDEX,
    timeFieldName,
    dataSource: (dataSource ?? DEFAULT_DATA.STRUCTURES.LOCAL_DATASOURCE) as Dataset['dataSource'],
  };

  // Bound the preview to the picked time range (same clause the histogram uses) so the log lines
  // agree with the histogram. Only when we have both a time field and explicit bounds; otherwise
  // (non-time index, or no bounds passed) fall back to the latest `size` docs.
  const whereClause =
    timeFieldName && from != null && to != null
      ? ` | ${timeWhereClause(timeFieldName, from, to)}`
      : '';
  const sortClause = timeFieldName ? ` | sort - \`${timeFieldName}\`` : '';

  const path = `/api/enhancements/search/${SEARCH_STRATEGY_PPL}`;
  const response = await services.http.post(path, {
    signal,
    body: JSON.stringify({
      query: {
        // Backtick-quote the time field so dotted nested paths (e.g. `attributes.time`) and
        // reserved words sort correctly.
        query: `source = ${indexName}${whereClause}${sortClause} | head ${size}`,
        language: 'PPL',
        dataset: previewDataset,
        format: 'jdbc',
      },
    }),
  });

  const rows = extractRows(response);
  const columns = deriveColumns(rows, timeFieldName);
  return { columns, rows };
};

// Normalize a search response into row objects. PPL (query enhancements) returns a columnar
// `data_frame` (`body.fields[] = { name, values[] }`); the classic search path returns
// `hits.hits[]._source`. Handle both.
export function extractRows(response: any): PreviewRow[] {
  const fields = response?.body?.fields;
  if (Array.isArray(fields) && fields.length > 0) {
    const rowCount = response?.body?.size ?? fields[0]?.values?.length ?? 0;
    const rows: PreviewRow[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row: PreviewRow = {};
      fields.forEach((f: { name: string; values: unknown[] }) => {
        row[f.name] = f.values?.[i];
      });
      rows.push(row);
    }
    return rows;
  }
  const hits = response?.hits?.hits ?? [];
  return hits.map((h: { _source: PreviewRow }) => h._source ?? {});
}

// Translate low-level search errors into actionable guidance. The most common one on a bare
// cluster is a missing PPL engine (the SQL plugin isn't installed), which otherwise surfaces as
// a cryptic "Bad Request".
export function toFriendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? '');
  if (/_plugins\/_ppl|no handler found|_ppl/i.test(raw)) {
    return 'Preview needs the PPL query engine, which is not available on this cluster. You can still create a dataset and query it.';
  }
  return raw || 'Unable to preview this index';
}

// Pick up to 6 columns, leading with the time field when present.
export function deriveColumns(rows: PreviewRow[], timeFieldName?: string): string[] {
  const seen = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((k) => seen.add(k)));
  const all = Array.from(seen);
  if (timeFieldName && all.includes(timeFieldName)) {
    return [timeFieldName, ...all.filter((c) => c !== timeFieldName)].slice(0, 6);
  }
  return all.slice(0, 6);
}
