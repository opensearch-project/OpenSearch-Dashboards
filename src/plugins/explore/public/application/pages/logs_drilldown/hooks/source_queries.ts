/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Dataset, DEFAULT_DATA } from '../../../../../../data/common';
import { fillTimeBucketGaps } from '../../../../components/chart/utils/point_series';
import {
  HISTOGRAM_RESULT_COLUMNS,
  SourceTypeLogsDrilldown,
  SourceTypeLogsDrilldownItem,
  SourceTypeLogsDrilldownScope,
} from '../../../../services/source_type_registry';
import { ExploreServices } from '../../../../types';
import { SOURCE_PREVIEW_SIZE } from '../constants';
import { normalizeSeverity } from '../severity';
import { HistogramResult, SeverityTotal } from './fetch_histogram';
import { PreviewResult, PreviewRow } from './fetch_preview';

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
 * Histogram intervals, smallest first: [interval, milliseconds]. The interval is in the form a
 * source's `buildHistogramQuery` receives (and Explore's histogram uses): a count and a unit. Each
 * step is at most about twice the last, so a range gets between about 10 and 20 bars.
 */
const INTERVALS: Array<[string, number]> = [
  ['1s', 1000],
  ['2s', 2000],
  ['5s', 5000],
  ['10s', 10000],
  ['30s', 30000],
  ['1m', 60000],
  ['2m', 120000],
  ['5m', 300000],
  ['10m', 600000],
  ['15m', 900000],
  ['30m', 1800000],
  ['1h', 3600000],
  ['2h', 7200000],
  ['3h', 10800000],
  ['6h', 21600000],
  ['12h', 43200000],
  ['1d', 86400000],
  ['2d', 172800000],
  ['3d', 259200000],
  ['7d', 604800000],
  ['14d', 1209600000],
  ['30d', 2592000000],
];
/** At most this many bars on a card. */
const TARGET_BUCKETS = 20;

/** The smallest interval that keeps [from, to] at about TARGET_BUCKETS bars or fewer. */
export const cardHistogramInterval = (
  from: number,
  to: number
): { interval: string; intervalMs: number } => {
  const span = Math.max(to - from, 1000);
  const [interval, intervalMs] =
    INTERVALS.find(([, ms]) => span / ms <= TARGET_BUCKETS) ?? INTERVALS[INTERVALS.length - 1];
  return { interval, intervalMs };
};

/** A card's histogram from the rows of its histogram query (HISTOGRAM_RESULT_COLUMNS). */
export const toHistogramResult = (
  rows: Array<Record<string, unknown>>,
  intervalMs: number,
  from: number,
  to: number
): HistogramResult => {
  const dataPoints = rows
    .map((row): [number, number] => [
      toEpochMs(row[HISTOGRAM_RESULT_COLUMNS.time]),
      Number(row[HISTOGRAM_RESULT_COLUMNS.count]) || 0,
    ])
    .filter(([time]) => Number.isFinite(time))
    .sort(([a], [b]) => a - b);
  const series = [
    {
      name: 'count',
      dataPoints: fillTimeBucketGaps(
        dataPoints.map(([x, y]) => ({ x, y })),
        intervalMs,
        from,
        to
      ).map((p) => [p.x, p.y] as [number, number]),
    },
  ];
  const totals: SeverityTotal[] = [
    {
      name: 'count',
      total: dataPoints.reduce((sum, [, count]) => sum + count, 0),
      bucket: normalizeSeverity('count'),
    },
  ];
  return { series, intervalMs, from, to, totals };
};

/** A bucket time as epoch milliseconds: a number, or an ISO or zone-less UTC date string. */
const toEpochMs = (value: unknown): number => {
  if (typeof value === 'number') return value;
  const text = String(value ?? '');
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(text);
  return Date.parse(hasZone ? text : `${text.replace(' ', 'T')}Z`);
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

/** Keeps the rejection as is (status, name…) when it's an Error; else one with its text. */
const asError = (reason: unknown): Error =>
  reason instanceof Error
    ? reason
    : new Error(
        typeof reason === 'string' && reason
          ? reason
          : i18n.translate('explore.logsDrilldown.source.queryFailed', {
              defaultMessage: 'The query failed.',
            })
      );

/**
 * The dataset one item queries as: the source's `toDataset` for that item alone. Rejects when the
 * dataset isn't of one of the source's types (the contract), so a card never queries another
 * source's data.
 */
export const itemDataset = async (
  drilldown: SourceTypeLogsDrilldown,
  datasetTypes: string[],
  scope: SourceTypeLogsDrilldownScope,
  item: SourceTypeLogsDrilldownItem
): Promise<Dataset> => {
  const dataset = await drilldown.toDataset({ scope, items: [item] });
  if (!dataset || !datasetTypes.includes(dataset.type)) {
    throw new Error(
      i18n.translate('explore.logsDrilldown.source.wrongDatasetType', {
        defaultMessage: 'The source returned a dataset of another type ({type}).',
        values: { type: dataset?.type ?? '' },
      })
    );
  }
  return dataset;
};

/** The data view a dataset queries through, caching the dataset first if needed. */
const dataViewFor = async (services: ExploreServices, dataset: Dataset) => {
  const { dataViews, query } = services.data;
  const onlyCheckCache = dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;
  let dataView = await dataViews.get(dataset.id, onlyCheckCache).catch(() => undefined);
  if (!dataView) {
    await query.queryString.getDatasetService().cacheDataset(
      dataset,
      {
        uiSettings: services.uiSettings,
        savedObjects: services.savedObjects,
        notifications: services.notifications,
        http: services.http,
        data: services.data,
      },
      false
    );
    dataView = await dataViews.get(dataset.id, onlyCheckCache);
  }
  if (!dataView) {
    throw new Error(
      i18n.translate('explore.logsDrilldown.source.noDataView', {
        defaultMessage: "The dataset couldn't be loaded.",
      })
    );
  }
  return dataView;
};

/**
 * Runs one query in the dataset's language through the data plugin's search service, the same
 * path as the Logs page: the language's search interceptor runs it (for an async source, it starts,
 * polls and stops it), on the page's time range. Resolves with its rows.
 */
const runQuery = async (
  services: ExploreServices,
  dataset: Dataset,
  queryText: string,
  size: number,
  signal: AbortSignal
): Promise<Array<Record<string, unknown>>> => {
  const dataView = await dataViewFor(services, dataset);
  const searchSource = await services.data.search.searchSource.create();
  searchSource.setFields({
    index: dataView,
    size,
    query: { query: queryText, language: dataset.language ?? '', dataset },
    highlightAll: false,
    version: false,
  });
  const response = await searchSource.fetch({ abortSignal: signal });
  return ((response?.hits?.hits ?? []) as Array<{ _source?: Record<string, unknown> }>).map(
    (hit) => hit._source ?? {}
  );
};

/**
 * Runs one card of a registered source: its preview and, when the source builds one, its
 * histogram, in parallel, through the item's dataset. A failed preview fails the card; a failed
 * histogram only hides the chart.
 */
export const runSourceCard = async ({
  services,
  drilldown,
  datasetTypes,
  scope,
  item,
  from,
  to,
  ranWith,
  signal,
}: {
  services: ExploreServices;
  drilldown: SourceTypeLogsDrilldown;
  datasetTypes: string[];
  scope: SourceTypeLogsDrilldownScope;
  item: SourceTypeLogsDrilldownItem;
  /** The page's time range (epoch milliseconds), for the histogram's buckets. */
  from: number;
  to: number;
  ranWith: string;
  signal: AbortSignal;
}): Promise<SourceCardResult> => {
  const dataset = await itemDataset(drilldown, datasetTypes, scope, item);
  const args = { scope, item, dataset };
  const previewText = drilldown.buildPreviewQuery({ ...args, size: SOURCE_PREVIEW_SIZE });

  const { interval, intervalMs } = cardHistogramInterval(from, to);
  const timeFieldName = item.timeFieldName ?? dataset.timeFieldName;
  const histogramText =
    drilldown.buildHistogramQuery && timeFieldName
      ? drilldown.buildHistogramQuery({ ...args, interval, timeFieldName })
      : undefined;

  const [preview, histogram] = await Promise.allSettled([
    runQuery(services, dataset, previewText, SOURCE_PREVIEW_SIZE, signal),
    histogramText
      ? runQuery(services, dataset, histogramText, Math.ceil((to - from) / intervalMs) + 1, signal)
      : Promise.resolve(undefined),
  ]);
  if (preview.status === 'rejected') throw asError(preview.reason);

  // At most the size asked for, whatever the source returns.
  const rows = (preview.value ?? []).slice(0, SOURCE_PREVIEW_SIZE) as PreviewRow[];
  return {
    preview: { rows, columns: previewColumns(rows, timeFieldName) },
    ...(histogram.status === 'fulfilled'
      ? {
          histogram: histogram.value
            ? toHistogramResult(histogram.value, intervalMs, from, to)
            : undefined,
        }
      : { histogramError: asError(histogram.reason).message }),
    ranWith,
  };
};
