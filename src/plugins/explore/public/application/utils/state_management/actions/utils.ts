/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import {
  AggConfigs,
  DataView,
  formatTimePickerDate,
  parseInterval,
} from '../../../../../../../../src/plugins/data/common';
import { ExploreServices } from '../../../../types';
import { ISearchResult } from '../slices';
import { createHistogramConfigs } from '../../../../components/chart/utils';
import { RootState } from '../store';
import { calculateTraceInterval } from '../constants';
import { maskPPLSubqueriesAndStrings } from '../../languages/ppl/mask_ppl_subqueries_and_strings';

export interface HistogramConfig {
  histogramConfigs: AggConfigs | undefined;
  aggs: Record<string, any> | undefined;
  effectiveInterval: string;
  finalInterval: string;
  fromDate: string;
  toDate: string;
  timeFieldName: string;
  breakdownField?: string;
}

/**
 * Converts a timestamp string to Unix epoch time in milliseconds.
 * Handles both ISO 8601 timestamps with timezone info and timestamps without timezone.
 * If no timezone information is present, assumes UTC by appending 'Z'.
 *
 * @param timestampStr - Timestamp string to convert
 * @returns Unix epoch time in milliseconds
 */
function parseTimestampToMs(timestampStr: string): number {
  const hasTimezoneInfo =
    timestampStr.includes('Z') ||
    timestampStr.includes('+') ||
    (timestampStr.includes('-') && timestampStr.lastIndexOf('-') > 10);

  return hasTimezoneInfo
    ? new Date(timestampStr).getTime()
    : new Date(timestampStr + 'Z').getTime();
}

/**
 * Fills in missing timestamps in a time series map with zero values
 *
 * @param seriesMap - Map of series names to arrays of [timestamp, count] tuples
 * @param intervalStr - Interval string (e.g., '1h', '5m', '1d')
 * @param fromDate - Start date string in format 'YYYY-MM-DD HH:mm:ss.SSS'
 * @param toDate - End date string in format 'YYYY-MM-DD HH:mm:ss.SSS'
 * @returns New Map with all series filled with complete timestamp arrays
 */
export function fillMissingTimestamps(
  seriesMap: Map<string, Array<[number, number]>>,
  intervalStr: string,
  fromDate: string,
  toDate: string
): Map<string, Array<[number, number]>> {
  if (seriesMap.size === 0) {
    return new Map();
  }

  const intervalDuration = parseInterval(intervalStr);
  if (!intervalDuration) {
    return seriesMap;
  }

  const startTime = moment.utc(fromDate, 'YYYY-MM-DD HH:mm:ss.SSS');
  const endTime = moment.utc(toDate, 'YYYY-MM-DD HH:mm:ss.SSS');

  // generate complete timestamp array (inclusive of start and end)
  const allTimestamps: number[] = [];
  const currentTime = startTime.clone();

  while (currentTime.isSameOrBefore(endTime)) {
    allTimestamps.push(currentTime.valueOf());
    currentTime.add(intervalDuration);
  }

  const filledSeriesMap = new Map<string, Array<[number, number]>>();

  seriesMap.forEach((dataPoints, seriesName) => {
    // create a map of existing timestamps to counts for fast lookup
    const existingDataMap = new Map<number, number>();
    dataPoints.forEach(([timestamp, count]) => {
      existingDataMap.set(timestamp, count);
    });

    // generate filled array with all timestamps
    const filledDataPoints: Array<[number, number]> = allTimestamps.map((timestamp) => {
      const count = existingDataMap.get(timestamp) ?? 0;
      return [timestamp, count];
    });

    filledSeriesMap.set(seriesName, filledDataPoints);
  });

  return filledSeriesMap;
}

/**
 * Checks if the main query ends with a head command (optionally followed by `from N` or `| where`).
 * Subquery brackets and quoted strings are masked so that head inside them is ignored.
 */
export const queryEndsWithHead = (queryString: string): boolean => {
  const masked = maskPPLSubqueriesAndStrings(queryString);
  return /\|\s*head\b(\s+\d+)?(\s+from\s+\d+)?\s*(\|\s*where\b.*)?\s*$/i.test(masked);
};

/**
 * Checks if a PPL query contains a `stats` command, whose output rows are aggregation
 * buckets rather than documents. Subquery brackets and quoted strings are masked so that
 * `stats` inside them is ignored.
 *
 * Used to detect queries where the hit counter should show bucket count separately from
 * document count. Other aggregating commands (chart, timechart, top, rare, etc.) will be
 * added in a follow-up PR once stripStatsFromQuery is extended to handle them.
 */
export const queryHasStats = (queryString: string): boolean => {
  const masked = maskPPLSubqueriesAndStrings(queryString);
  return /\|\s*stats\b/i.test(masked);
};

export const buildPPLHistogramQuery = (query: string, histogramConfig: HistogramConfig): string => {
  const { aggs, finalInterval, timeFieldName, breakdownField } = histogramConfig;

  if (!aggs || !timeFieldName || !finalInterval) {
    return query;
  }

  if (breakdownField) {
    return `${query} | rename ${timeFieldName} as @timestamp | timechart span=${finalInterval} limit=4 count() by ${breakdownField}`;
  } else {
    return `${query} | stats count() by span(${timeFieldName}, ${finalInterval})`;
  }
};

/** Bucket expression for the time field. Only valid aliased inside a derived table. */
const intervalToSQLBucket = (interval: string, timeFieldName: string): { expr: string } => {
  const field = `\`${timeFieldName}\``;
  const match = interval.match(/^(\d+)\s*([smhdwMy])$/);
  // Fall back to per-second bucketing for an unparseable interval.
  const normalized = match ? `${match[1]}${match[2]}` : '1s';

  return { expr: `date_histogram(field=${field}, interval='${normalized}')` };
};

/** Parse a bucket key ("2026-05-01 14:30:00", UTC) back to epoch milliseconds. */
const parseSQLBucketToMs = (bucket: string): number => {
  const [datePart, timePart = '00:00:00'] = bucket.split(' ');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [hh, mi, ss] = timePart.split(':').map(Number);
  return Date.UTC(y, (mo || 1) - 1, d || 1, hh || 0, mi || 0, ss || 0);
};

/** Matches PPL's `timechart limit=4`. */
const HISTOGRAM_BREAKDOWN_SERIES_LIMIT = 4;

/** PPL `timechart`'s default `otherstr`. */
const HISTOGRAM_OTHER_LABEL = 'OTHER';

/** PPL `timechart`'s default `nullstr`. */
const HISTOGRAM_NULL_LABEL = 'NULL';

/** Render a breakdown value for a SQL IN-list. */
const toSQLLiteral = (value: string | number): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return `'${String(value).replace(/'/g, "''")}'`;
};

/** Pass 1 of the breakdown histogram: the top-N values, which pass 2 then buckets by. */
export const buildSQLTopBreakdownQuery = (
  query: string,
  histogramConfig: HistogramConfig,
  limit: number = HISTOGRAM_BREAKDOWN_SERIES_LIMIT
): string => {
  const { breakdownField } = histogramConfig;
  if (!breakdownField) {
    return query;
  }
  // Order by the expression, not an alias — aliases on aggregates are unreliable here.
  return (
    `SELECT breakdown, COUNT(*) ` +
    `FROM (SELECT \`${breakdownField}\` AS breakdown FROM (${query}) sub_inner) sub ` +
    `GROUP BY breakdown ORDER BY COUNT(*) DESC LIMIT ${limit}`
  );
};

export const buildSQLHistogramQuery = (
  query: string,
  histogramConfig: HistogramConfig,
  breakdownValues?: Array<string | number>
): string => {
  const { aggs, finalInterval, timeFieldName, breakdownField } = histogramConfig;

  if (!aggs || !timeFieldName || !finalInterval) {
    return query;
  }
  const { expr } = intervalToSQLBucket(finalInterval, timeFieldName);

  // A trailing LIMIT is left in place, so the histogram aggregates over the
  // same rows the user asked for, as PPL does with `| head N`.
  //
  // COUNT(*) is deliberately not aliased: the analytics engine records the
  // alias in the plan but names the physical column `COUNT(*)`, and the
  // mismatch throws. The result parser reads it by position.
  //
  // Relabelling the breakdown rather than filtering with IN keeps the long
  // tail counted in an OTHER series, matching `timechart`.
  if (breakdownField) {
    const field = `\`${breakdownField}\``;
    const breakdownExpr =
      breakdownValues && breakdownValues.length > 0
        ? `CASE WHEN ${field} IS NULL THEN '${HISTOGRAM_NULL_LABEL}' ` +
          `WHEN ${field} IN (${breakdownValues.map(toSQLLiteral).join(', ')}) THEN ${field} ` +
          `ELSE '${HISTOGRAM_OTHER_LABEL}' END`
        : field;
    return (
      `SELECT time_bucket, breakdown, COUNT(*) ` +
      `FROM (SELECT ${expr} AS time_bucket, ${breakdownExpr} AS breakdown FROM (${query}) sub_inner) sub ` +
      `GROUP BY time_bucket, breakdown ORDER BY time_bucket`
    );
  }

  return (
    `SELECT time_bucket, COUNT(*) ` +
    `FROM (SELECT ${expr} AS time_bucket FROM (${query}) sub_inner) sub ` +
    `GROUP BY time_bucket ORDER BY time_bucket`
  );
};

export const processRawResultsForHistogram = (
  queryString: string,
  rawResults: ISearchResult,
  histogramConfig: HistogramConfig,
  isSQLHistogram: boolean = false
) => {
  const { aggs, breakdownField } = histogramConfig;

  if (!aggs) {
    return rawResults;
  }

  if (isSQLHistogram) {
    // Handle SQL histogram results
    const responseAggs: any = {};
    const fieldSchema = rawResults.fieldSchema;

    if (!fieldSchema || fieldSchema.length < 2) {
      return rawResults;
    }

    const bucketIdx = fieldSchema.findIndex((col: any) => col.name === 'time_bucket');
    if (bucketIdx === -1) {
      return rawResults;
    }
    const bucketName = fieldSchema[bucketIdx].name!;

    // Columns are [time_bucket, breakdown, COUNT(*)].
    if (breakdownField) {
      const breakdownIdx = fieldSchema.findIndex((col: any) => col.name === 'breakdown');
      if (breakdownIdx === -1) {
        return rawResults;
      }
      // The count is whichever column isn't the bucket or the breakdown.
      const breakdownCountIdx = fieldSchema.findIndex(
        (_col: any, idx: number) => idx !== bucketIdx && idx !== breakdownIdx
      );
      if (breakdownCountIdx === -1) {
        return rawResults;
      }
      const breakdownName = fieldSchema[breakdownIdx].name!;
      const breakdownCountName = fieldSchema[breakdownCountIdx].name!;

      const seriesMap = new Map<string, Array<[number, number]>>();
      let breakdownTotalHits = 0;
      rawResults.hits.hits.forEach((hit) => {
        const source = hit._source as Record<string, unknown>;
        const timestamp = parseSQLBucketToMs(String(source[bucketName]));
        const breakdownValue = String(source[breakdownName]);
        const count = Number(source[breakdownCountName]) || 0;

        breakdownTotalHits += count;

        if (!seriesMap.has(breakdownValue)) {
          seriesMap.set(breakdownValue, []);
        }
        seriesMap.get(breakdownValue)!.push([timestamp, count]);
      });

      const series = Array.from(seriesMap.entries()).map(([breakdownValue, dataPoints]) => ({
        breakdownValue,
        dataPoints,
      }));

      return {
        ...rawResults,
        hits: {
          ...rawResults.hits,
          total: breakdownTotalHits,
        },
        breakdownSeries: {
          breakdownField,
          series,
        },
      };
    }

    // Single series: the query returns two columns (bucket + count). Treat the
    // non-bucket column as the count so we're resilient to how the engine
    // names the aggregate (doc_count / COUNT(*) / etc.).
    const countIdx = bucketIdx === 0 ? 1 : 0;
    const countName = fieldSchema[countIdx].name!;

    // Create aggregation response in expected format
    let totalHits = 0;
    Object.entries(aggs as Record<number, any>).forEach(([key, value]) => {
      const aggTypeKeys = Object.keys(value);
      if (aggTypeKeys.length === 0) return;

      const aggTypeKey = aggTypeKeys[0];
      if (aggTypeKey === 'date_histogram') {
        const buckets = rawResults.hits.hits.map((hit) => {
          const source = hit._source as Record<string, unknown>;
          const count = Number(source[countName]) || 0;
          const timeBucket = parseSQLBucketToMs(String(source[bucketName]));

          totalHits += count;

          return {
            key_as_string: new Date(timeBucket).toISOString(),
            key: timeBucket,
            doc_count: count,
          };
        });

        responseAggs[key] = { buckets };
      }
    });

    const tempResult: ISearchResult = {
      ...rawResults,
      aggregations: responseAggs,
      hits: {
        ...rawResults.hits,
        total: totalHits,
      },
    };

    return tempResult;
  }

  // Original PPL histogram processing
  const aggsConfig: any = {};

  Object.entries(aggs as Record<number, any>).forEach(([key, value]) => {
    const aggTypeKeys = Object.keys(value);
    if (aggTypeKeys.length === 0) {
      return aggsConfig;
    }
    const aggTypeKey = aggTypeKeys[0];
    if (aggTypeKey === 'date_histogram') {
      aggsConfig[aggTypeKey] = {
        ...value[aggTypeKey],
      };
      aggsConfig.qs = { [key]: queryString };
    }
  });

  // breakdownField from the histogramConfig will be definitive for knowing if we sent out timechart
  if (breakdownField) {
    const seriesMap = new Map<string, Array<[number, number]>>();
    const fieldSchema = rawResults.fieldSchema;

    if (!fieldSchema || fieldSchema.length < 3) {
      return rawResults;
    }

    const timestampIdx = fieldSchema.findIndex((col: any) => col.name === '@timestamp');
    const breakdownIdx = fieldSchema.findIndex((col: any) => col.name === breakdownField);
    // Support both 'count' and 'count()' column names from PPL
    let countIdx = fieldSchema.findIndex((col: any) => col.name === 'count()');
    if (countIdx === -1) {
      countIdx = fieldSchema.findIndex((col: any) => col.name === 'count');
    }

    if (breakdownIdx === -1 || countIdx === -1) {
      return rawResults;
    }

    let totalHits = 0;
    rawResults.hits.hits.forEach((hit) => {
      const sourceValues = Object.values(hit._source);
      const timestampStr = String(sourceValues[timestampIdx]);
      const breakdownValue = String(sourceValues[breakdownIdx]);
      const count = Number(sourceValues[countIdx]) || 0;

      const timestamp = parseTimestampToMs(timestampStr);

      totalHits += count;

      if (!seriesMap.has(breakdownValue)) {
        seriesMap.set(breakdownValue, []);
      }
      seriesMap.get(breakdownValue)!.push([timestamp, count]);
    });

    const series = Array.from(seriesMap.entries()).map(([breakdownValue, dataPoints]) => ({
      breakdownValue,
      dataPoints,
    }));

    return {
      ...rawResults,
      hits: {
        ...rawResults.hits,
        total: totalHits,
      },
      breakdownSeries: {
        breakdownField,
        series,
      },
    };
  } else {
    const responseAggs: any = {};

    for (const [key, _aggQueryString] of Object.entries(aggsConfig.qs)) {
      responseAggs[key] = rawResults?.hits.hits.map((hit) => {
        if (rawResults?.fieldSchema && rawResults.fieldSchema.length >= 2) {
          const valueField = rawResults.fieldSchema[0].name!;
          const keyField = rawResults.fieldSchema[1].name!;
          return {
            key: hit._source[keyField],
            value: hit._source[valueField],
          };
        }
        const sourceValues = Object.values(hit._source);
        return {
          key: sourceValues[1],
          value: sourceValues[0],
        };
      });
    }

    const tempResult: ISearchResult = { ...rawResults, aggregations: {} };

    Object.entries(responseAggs).forEach(([id, value]) => {
      if (aggsConfig && aggsConfig.date_histogram) {
        let totalHits = 0;
        const buckets = value as Array<{ key: string; value: number }>;
        tempResult.aggregations[id] = {
          buckets: buckets.map((bucket) => {
            const timestamp = parseTimestampToMs(bucket.key);
            totalHits += bucket.value;
            return {
              key_as_string: bucket.key,
              key: timestamp,
              doc_count: bucket.value,
            };
          }),
        };
        tempResult.hits.total = totalHits;
      }
    });

    return tempResult;
  }
};

export const createHistogramConfigWithInterval = (
  dataView: DataView,
  interval: string | undefined,
  services: ExploreServices,
  getState: () => RootState,
  customBarTarget?: number
): HistogramConfig | null => {
  if (!dataView.timeFieldName || !interval) {
    return null;
  }

  const state = getState();
  const effectiveInterval = interval || state.legacy?.interval || 'auto';
  const breakdownField = state.queryEditor.breakdownField;

  const histogramConfigs = createHistogramConfigs(
    dataView,
    effectiveInterval,
    services.data,
    services.uiSettings,
    breakdownField,
    customBarTarget
  );
  const aggs = histogramConfigs?.toDsl();

  if (!aggs || !histogramConfigs) {
    return null;
  }

  const { fromDate, toDate } = formatTimePickerDate(
    services.data.query.timefilter.timefilter.getTime(),
    'YYYY-MM-DD HH:mm:ss.SSS'
  );

  // Extract interval directly from the buckets we configured
  let finalInterval: string = effectiveInterval;

  // Find the date histogram aggregation - it could be at different indices
  const dateHistogramAgg = histogramConfigs.aggs?.find(
    (agg: any) => agg && agg.type && agg.type.name === 'date_histogram'
  ) as any;

  if (dateHistogramAgg?.buckets) {
    // For traces with custom bar target, bypass TimeBuckets and calculate interval manually
    // TimeBuckets doesn't honor our minimum interval settings reliably
    if (customBarTarget) {
      const bounds = services.data.query.timefilter.timefilter.calculateBounds(
        services.data.query.timefilter.timefilter.getTime()
      );
      const diffDays =
        bounds.max && bounds.min
          ? (bounds.max.valueOf() - bounds.min.valueOf()) / (1000 * 60 * 60 * 24)
          : 0;

      const calculatedInterval = calculateTraceInterval(diffDays);
      if (calculatedInterval) {
        finalInterval = calculatedInterval;
      } else {
        // For < 7 days, use TimeBuckets
        const bucketInterval = dateHistogramAgg.buckets.getInterval();
        finalInterval = bucketInterval.expression || bucketInterval.interval || effectiveInterval;
      }
    } else {
      const bucketInterval = dateHistogramAgg.buckets.getInterval();
      finalInterval = bucketInterval.expression || bucketInterval.interval || effectiveInterval;
    }
  }

  return {
    histogramConfigs,
    aggs,
    effectiveInterval,
    finalInterval,
    fromDate,
    toDate,
    timeFieldName: dataView.timeFieldName,
    breakdownField,
  };
};
