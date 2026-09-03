/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { IndexPattern } from '../../../../../opensearch_dashboards_services';
import { getServices } from '../../../../../opensearch_dashboards_services';
import { SurrDocType, OpenSearchHitRecord, OpenSearchHitRecordList } from './context';
import { SortDirection } from './utils/sorting';
import { generateIntervals } from './utils/generate_intervals';
import { convertIsoToMillis, extractNanos, convertTimeValueToIso } from './utils/date_conversion';

const DAY_MILLIS = 24 * 60 * 60 * 1000;
const LOOKUP_OFFSETS = [0, 1, 7, 30, 365, 10000].map((days) => days * DAY_MILLIS);

const PPL_SEARCH_PATH = '/api/enhancements/search/ppl';

// Metadata fields returned by PPL when include_metadata=true; excluded from _source.
const META_FIELDS = new Set(['_id', '_index', '_score', '_maxscore', '_sort', '_routing']);

interface PPLSearchResponse {
  body?: {
    fields?: Array<{ name: string; type: string; values: unknown[] }>;
    size?: number;
  };
}

/**
 * Convert a PPL IDataFrame response (with include_metadata=true) into OpenSearchHitRecord objects.
 * PPL returns columnar data: fields[i].values[rowIndex] gives the value for row `rowIndex`.
 */
function pplResponseToHitRecords(response: PPLSearchResponse): OpenSearchHitRecordList {
  const fields = response.body?.fields;
  if (!fields || !fields.length) return [];

  const rowCount = response.body?.size ?? fields[0].values.length;
  const records: OpenSearchHitRecordList = [];

  for (let row = 0; row < rowCount; row++) {
    const _source: Record<string, unknown> = {};
    let _id = '';
    let sortValue: number | undefined;

    for (const field of fields) {
      const val = field.values[row];
      if (field.name === '_id') {
        _id = String(val ?? '');
      } else if (field.name === '_sort') {
        sortValue = Array.isArray(val) ? (val[0] as number) : (val as number);
      } else if (!META_FIELDS.has(field.name)) {
        _source[field.name] = val;
      }
    }

    records.push({ _id, _source, fields: {}, sort: sortValue !== undefined ? [sortValue] : [] });
  }

  return records;
}

/**
 * Fetch the anchor document by _id using PPL with include_metadata=true.
 */
export async function fetchPPLAnchor(
  anchorId: string,
  indexPattern: IndexPattern
): Promise<OpenSearchHitRecord> {
  const { http, data } = getServices();
  const pplQuery = `source=\`${indexPattern.title}\` | where _id = '${anchorId}' | head 1`;

  const response = (await http.post(PPL_SEARCH_PATH, {
    body: JSON.stringify({
      query: {
        query: pplQuery,
        language: 'PPL',
        dataset: data.query.queryString.getQuery().dataset,
        format: 'jdbc',
      },
      includeMetadata: true,
    }),
  })) as PPLSearchResponse;

  const records = pplResponseToHitRecords(response);
  if (!records.length) {
    throw new Error(
      i18n.translate('explore.discover.context.ppl.failedToLoadAnchorDocumentErrorDescription', {
        defaultMessage: 'Failed to load anchor document.',
      })
    );
  }

  return { ...records[0], isAnchor: true };
}

/**
 * Fetch successor or predecessor documents around the anchor using PPL with include_metadata=true.
 * Uses the same expanding-interval strategy as the DSL fetchSurroundingDocs.
 */
export async function fetchPPLSurroundingDocs(
  type: SurrDocType,
  indexPattern: IndexPattern,
  anchor: OpenSearchHitRecord,
  sortDir: SortDirection,
  size: number
): Promise<OpenSearchHitRecordList> {
  if (!anchor || !size) return [];

  const { http, data } = getServices();
  const timeField = indexPattern.timeFieldName!;

  const nanos = indexPattern.isTimeNanosBased() ? extractNanos(anchor._source[timeField]) : '';
  const timeValueMillis =
    nanos !== '' ? convertIsoToMillis(anchor._source[timeField]) : anchor.sort[0];

  const sortDirToApply = type === SurrDocType.SUCCESSORS ? sortDir : reverseSortDir(sortDir);
  const intervals = generateIntervals(LOOKUP_OFFSETS, timeValueMillis, type, sortDir);

  let documents: OpenSearchHitRecordList = [];

  for (const [start, stop] of intervals) {
    const remainingSize = size - documents.length;
    if (remainingSize <= 0) break;

    const where = buildWhereClause(timeField, anchor._id, start, stop, sortDir, type);
    const sortOrder = sortDirToApply === SortDirection.asc ? '+' : '-';
    const pplQuery =
      `source=\`${indexPattern.title}\` | where ${where} | ` +
      `sort ${sortOrder} \`${timeField}\` | head ${remainingSize}`;

    const response = (await http.post(PPL_SEARCH_PATH, {
      body: JSON.stringify({
        query: {
          query: pplQuery,
          language: 'PPL',
          dataset: data.query.queryString.getQuery().dataset,
          format: 'jdbc',
        },
        includeMetadata: true,
        skipTimeFilter: true,
        skipFilters: true,
      }),
    })) as PPLSearchResponse;

    const hits = pplResponseToHitRecords(response);

    documents =
      type === SurrDocType.SUCCESSORS
        ? [...documents, ...hits]
        : [...hits.slice().reverse(), ...documents];
  }

  return documents;
}

function reverseSortDir(dir: SortDirection): SortDirection {
  return dir === SortDirection.asc ? SortDirection.desc : SortDirection.asc;
}

/**
 * Build a PPL WHERE clause mirroring DSL's time-range interval logic.
 * `generateIntervals` produces interval bounds with the correct sign for the type/sort combination;
 * ascending sort + successors → start is lower bound (>=), stop is upper bound (<).
 */
function buildWhereClause(
  timeField: string,
  anchorId: string,
  start: number | null,
  stop: number | null,
  sortDir: SortDirection,
  type: SurrDocType
): string {
  const conditions: string[] = [`_id != '${anchorId}'`];

  const ascending =
    (sortDir === SortDirection.asc && type === SurrDocType.SUCCESSORS) ||
    (sortDir === SortDirection.desc && type === SurrDocType.PREDECESSORS);

  const lowerMs = ascending ? start : stop;
  const upperMs = ascending ? stop : start;

  if (lowerMs !== null) {
    const iso = convertTimeValueToIso(lowerMs, '');
    if (iso) conditions.push(`\`${timeField}\` >= '${iso}'`);
  }
  if (upperMs !== null) {
    const iso = convertTimeValueToIso(upperMs, '');
    if (iso) conditions.push(`\`${timeField}\` < '${iso}'`);
  }

  return conditions.join(' AND ');
}
