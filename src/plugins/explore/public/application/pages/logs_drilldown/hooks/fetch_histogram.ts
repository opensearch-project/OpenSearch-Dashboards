/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { Dataset, DEFAULT_DATA, formatTimePickerDate } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';
import { fillTimeBucketGaps } from '../../../../components/chart/utils/point_series';
import { normalizeSeverity } from '../severity';

/**
 * Build the time-range WHERE clause exactly as the production query-enhancements PPL path does
 * (`FilterUtils.getTimeFilterWhereClause`): `TIMESTAMP('...')` literals are portable across modern
 * and legacy PPL engines. Our isolated `http.post` bypasses the search interceptor that would
 * normally inject this, so we add it here to bound the histogram to the picked time range.
 */
const timeWhereClause = (timeFieldName: string, from: number, to: number): string => {
  const { fromDate, toDate } = formatTimePickerDate(
    { from: new Date(from).toISOString(), to: new Date(to).toISOString() },
    'YYYY-MM-DD HH:mm:ss.SSS'
  );
  return `where \`${timeFieldName}\` >= TIMESTAMP('${fromDate}') and \`${timeFieldName}\` <= TIMESTAMP('${toDate}')`;
};

const SEARCH_STRATEGY_PPL = 'ppl';
// Target number of histogram bars — kept low (20) so bars are fat/scannable in the 360px card
// histogram column. The Query-mode full-width chart uses 50; for the small Rows card fewer is better.
const TARGET_BUCKETS = 20;

export interface SeverityTotal {
  /** Raw breakdown value (e.g. "INFO"), or 'count' for the no-severity case. */
  name: string;
  /** Coarse bucket for coloring. */
  bucket: ReturnType<typeof normalizeSeverity>;
  total: number;
}

/** One severity series' points as `[timestampMs, count]` tuples (raw, pre-render). */
export interface HistogramSeries {
  /** Raw breakdown value (e.g. "INFO"), or 'count' for the no-severity single series. */
  name: string;
  dataPoints: Array<[number, number]>;
}

export interface HistogramResult {
  /** Per-severity series (self-contained; the drilldown renders its own SVG bars from these). */
  series: HistogramSeries[];
  /** Bucket interval in ms (for the x-axis span). */
  intervalMs: number;
  /** Global time bounds (epoch ms). */
  from: number;
  to: number;
  /** Per-severity running totals for the card legend (group-by-sum over the response). */
  totals: SeverityTotal[];
}

interface FetchHistogramArgs {
  indexName: string;
  timeFieldName: string;
  severityField?: string;
  dataSource?: Dataset['dataSource'];
  /** Global time range bounds (epoch ms). */
  from: number;
  to: number;
}

/**
 * Runs a real PPL `date_histogram` (`stats count() by span(timeField, <auto>)`, optionally also
 * `, <severityField>`) for one index, out of Redux, and folds the columnar response into a `Chart`
 * (with `.series[]` stacked by severity when a severity field is present, else a single series) plus
 * per-severity totals for the legend. Abortable via `signal`.
 */
export const fetchHistogram = async (
  services: ExploreServices,
  { indexName, timeFieldName, severityField, dataSource, from, to }: FetchHistogramArgs,
  signal?: AbortSignal
): Promise<HistogramResult> => {
  const { interval, spanExpr } = autoSpan(from, to);

  const dataset: Dataset = {
    id: `logs-explore-hist::${dataSource?.id ?? ''}::${indexName}`,
    title: indexName,
    type: DEFAULT_DATA.SET_TYPES.INDEX,
    timeFieldName,
    dataSource: (dataSource ?? DEFAULT_DATA.STRUCTURES.LOCAL_DATASOURCE) as Dataset['dataSource'],
  };

  // Backtick-quote field identifiers so dotted nested paths (e.g. `attributes.time`) and reserved
  // words resolve, matching the WHERE clause above.
  const statsBy = severityField
    ? `span(\`${timeFieldName}\`, ${spanExpr}), \`${severityField}\``
    : `span(\`${timeFieldName}\`, ${spanExpr})`;
  // Bound to the picked time range (else the un-filtered stats returns every bucket across all
  // history, and gap-fill to now-15m leaves the recent buckets buried / mis-aligned).
  const query = `source = ${indexName} | ${timeWhereClause(
    timeFieldName,
    from,
    to
  )} | stats count() as count by ${statsBy}`;

  const response = await services.http.post(`/api/enhancements/search/${SEARCH_STRATEGY_PPL}`, {
    signal,
    body: JSON.stringify({
      query: { query, language: 'PPL', dataset, format: 'jdbc' },
    }),
  });

  const parsed = parseColumnar(response, timeFieldName, severityField);
  const intervalMs = interval.asMilliseconds();

  // Zero-fill empty buckets across the full [from,to] range using the SAME tried-and-tested helper
  // the production logs-explore histogram uses (`fillTimeBucketGaps`), so the x-axis reads
  // continuously and 0-count buckets are accounted for. The drilldown then renders its own SVG bars.
  const rawSeries: HistogramSeries[] = severityField
    ? parsed.series.map((s) => ({ name: s.breakdownValue, dataPoints: s.dataPoints }))
    : [{ name: 'count', dataPoints: parsed.single }];

  const series: HistogramSeries[] = rawSeries.map((s) => ({
    name: s.name,
    dataPoints: fillTimeBucketGaps(
      s.dataPoints.map(([x, y]) => ({ x, y })),
      intervalMs,
      from,
      to
    ).map((p) => [p.x, p.y] as [number, number]),
  }));

  return { series, intervalMs, from, to, totals: parsed.totals };
};

// Choose a span (interval) that yields ~TARGET_BUCKETS bars across [from,to], expressed in a PPL
// span unit. Returns the moment Duration (for the Chart) + the PPL span expression string.
function autoSpan(from: number, to: number): { interval: moment.Duration; spanExpr: string } {
  const rangeMs = Math.max(1, to - from);
  const rawMs = rangeMs / TARGET_BUCKETS;
  const candidates: Array<[number, string]> = [
    [1000, '1s'],
    [5000, '5s'],
    [10000, '10s'],
    [30000, '30s'],
    [60000, '1m'],
    [5 * 60000, '5m'],
    [10 * 60000, '10m'],
    [30 * 60000, '30m'],
    [60 * 60000, '1h'],
    [3 * 3600000, '3h'],
    [12 * 3600000, '12h'],
    [24 * 3600000, '1d'],
    [7 * 86400000, '7d'],
  ];
  const chosen = candidates.find(([ms]) => ms >= rawMs) ?? candidates[candidates.length - 1];
  return { interval: moment.duration(chosen[0], 'ms'), spanExpr: chosen[1] };
}

// Parse the PPL columnar `data_frame` response into per-severity series + totals (and the
// single-series [time,count][] when no severity field). Column names: the time bucket column echoes
// the `span(...)` expression, `count`, and the severity field.
function parseColumnar(
  response: any,
  timeFieldName: string,
  severityField?: string
): {
  series: Array<{ breakdownValue: string; dataPoints: Array<[number, number]> }>;
  single: Array<[number, number]>;
  totals: SeverityTotal[];
} {
  const fields: Array<{ name: string; values: unknown[] }> = response?.body?.fields ?? [];
  const size: number = response?.body?.size ?? fields[0]?.values?.length ?? 0;

  const countCol = fields.find((f) => /count/i.test(f.name))?.values ?? [];
  const sevCol = severityField ? fields.find((f) => f.name === severityField)?.values ?? [] : [];
  // The time-bucket column is whatever remains (the `span(...)` expression echoes as the column
  // name, which varies by engine) — pick the first field that is neither count nor severity.
  const timeCol =
    fields.find((f) => !/count/i.test(f.name) && (!severityField || f.name !== severityField))
      ?.values ?? [];

  // PPL returns bucket timestamps as naive strings (e.g. "2026-07-10 19:43:00") which are UTC but
  // have no zone marker — bare Date.parse() would read them as LOCAL time and shift every bucket by
  // the host's UTC offset, pushing the bars outside the query window (chart looks empty). Append
  // 'Z' when there's no zone info, matching the Query-mode histogram (actions/utils.ts).
  const toTs = (v: unknown): number => {
    if (typeof v === 'number') return v;
    const s = String(v);
    const hasZone =
      s.includes('Z') || s.includes('+') || (s.includes('-') && s.lastIndexOf('-') > 10);
    const t = new Date(hasZone ? s : `${s}Z`).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  const totalsMap = new Map<string, number>();
  const single: Array<[number, number]> = [];
  const seriesMap = new Map<string, Array<[number, number]>>();

  for (let i = 0; i < size; i++) {
    const ts = toTs(timeCol[i]);
    const count = Number(countCol[i]) || 0;
    if (severityField) {
      const sev = String(sevCol[i] ?? 'unknown');
      if (!seriesMap.has(sev)) seriesMap.set(sev, []);
      seriesMap.get(sev)!.push([ts, count]);
      totalsMap.set(sev, (totalsMap.get(sev) ?? 0) + count);
    } else {
      single.push([ts, count]);
      totalsMap.set('count', (totalsMap.get('count') ?? 0) + count);
    }
  }

  const totals: SeverityTotal[] = Array.from(totalsMap.entries())
    .map(([name, total]) => ({ name, total, bucket: normalizeSeverity(name) }))
    .sort((a, b) => b.total - a.total);

  return {
    series: Array.from(seriesMap.entries()).map(([breakdownValue, dataPoints]) => ({
      breakdownValue,
      dataPoints,
    })),
    single,
    totals,
  };
}
