/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { fillTimeBucketGaps } from '../../../../components/chart/utils/point_series';
import type {
  SourceTypeLogsDrilldown,
  SourceTypeLogsDrilldownHistogram,
  SourceTypeLogsDrilldownItem,
  SourceTypeLogsDrilldownScope,
} from '../../../../services/source_type_registry';
import { normalizeSeverity } from '../severity';
import { HistogramResult, SeverityTotal } from './fetch_histogram';
import { DEFAULT_PREVIEW_SIZE, PreviewResult, PreviewRow } from './fetch_preview';

/** What one run of a registered source's card returns. */
export interface SourceCardResult {
  preview: PreviewResult;
  /** Undefined when the source has no histogram, or when it failed (`histogramError`). */
  histogram?: HistogramResult;
  histogramError?: string;
  /** The page's refresh key the card ran with; a different current key means the card is stale. */
  ranWith: string;
}

/**
 * A source's histogram as the card renders it: buckets filled across [from, to] and per-severity
 * totals, the same shape OpenSearch's cards use.
 */
export const toHistogramResult = (
  histogram: SourceTypeLogsDrilldownHistogram,
  from: number,
  to: number
): HistogramResult => {
  const series = histogram.series.map((s) => ({
    name: s.name,
    dataPoints: fillTimeBucketGaps(
      s.dataPoints.map(([x, y]) => ({ x, y })),
      histogram.intervalMs,
      from,
      to
    ).map((p) => [p.x, p.y] as [number, number]),
  }));
  const totals: SeverityTotal[] = histogram.series
    .map((s) => ({
      name: s.name,
      total: s.dataPoints.reduce((sum, [, count]) => sum + (Number(count) || 0), 0),
      bucket: normalizeSeverity(s.name),
    }))
    .sort((a, b) => b.total - a.total);
  return { series, intervalMs: histogram.intervalMs, from, to, totals };
};

/** The columns a preview shows: the time field first, then up to five others. */
const previewColumns = (rows: PreviewRow[], timeFieldName?: string): string[] => {
  const names = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => names.add(key)));
  const rest = Array.from(names).filter((name) => name !== timeFieldName);
  return [...(timeFieldName && names.has(timeFieldName) ? [timeFieldName] : []), ...rest].slice(
    0,
    6
  );
};

const errorMessage = (error: unknown): string =>
  error instanceof Error && error.message
    ? error.message
    : i18n.translate('explore.logsDrilldown.source.queryFailed', {
        defaultMessage: 'The query failed.',
      });

/**
 * Runs one card of a registered source: its preview and, when the source has one, its histogram,
 * in parallel. A failed preview fails the card; a failed histogram only hides the chart.
 */
export const runSourceCard = async ({
  drilldown,
  scope,
  item,
  from,
  to,
  ranWith,
  signal,
}: {
  drilldown: SourceTypeLogsDrilldown;
  scope: SourceTypeLogsDrilldownScope;
  item: SourceTypeLogsDrilldownItem;
  from: number;
  to: number;
  ranWith: string;
  signal: AbortSignal;
}): Promise<SourceCardResult> => {
  const args = { scope, item, from, to, signal };
  const [preview, histogram] = await Promise.allSettled([
    drilldown.fetchPreview({ ...args, size: DEFAULT_PREVIEW_SIZE }),
    drilldown.fetchHistogram ? drilldown.fetchHistogram(args) : Promise.resolve(undefined),
  ]);
  if (preview.status === 'rejected') throw new Error(errorMessage(preview.reason));

  const rows = (preview.value?.rows ?? []) as PreviewRow[];
  return {
    preview: { rows, columns: previewColumns(rows, item.timeFieldName) },
    ...(histogram.status === 'fulfilled'
      ? { histogram: histogram.value ? toHistogramResult(histogram.value, from, to) : undefined }
      : { histogramError: errorMessage(histogram.reason) }),
    ranWith,
  };
};
