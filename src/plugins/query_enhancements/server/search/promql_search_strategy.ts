/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SharedGlobalConfig, Logger } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import dateMath from '@elastic/datemath';
import { ISearchStrategy, SearchUsage } from '../../../data/server';
import {
  DATA_FRAME_TYPES,
  IDataFrame,
  IDataFrameResponse,
  IOpenSearchDashboardsSearchRequest,
  Query,
  splitMultiQueries,
} from '../../../data/common';
import { interpolateLegendFormat, PromQLSearchOptions, PromQLStepResolution } from '../../common';
import { DEFAULT_RESOLUTION, interpolatePromQLMacros, resolveStep } from '../../common/metrics';
import {
  MetricResult,
  prometheusManager,
  PromQLQueryParams,
  PromQLQueryResponse,
} from '../connections/managers/prometheus_manager';

function normalizeResult(
  resultType: string | undefined,
  result: MetricResult[] | [number, string] | undefined
): MetricResult[] {
  if (!result) return [];
  if (resultType === 'scalar' || resultType === 'string') {
    const [timestamp, value] = result as [number, string];
    return [{ metric: {}, value: [timestamp, Number(value)] }];
  }
  return result as MetricResult[];
}

function parseTimeValue(
  value: string | undefined,
  options?: Parameters<typeof dateMath.parse>[1]
): number {
  if (!value) {
    throw new Error('Time or time range option missing');
  }
  const epoch = Number(value);
  if (Number.isFinite(epoch)) return epoch;
  const parsed = dateMath.parse(value, options)?.unix();
  if (!parsed) {
    throw new Error('Invalid time or time range option');
  }
  return parsed;
}

// MAX_SERIES_TABLE: Maximum series for table display
const MAX_SERIES_TABLE = 2000;
// We'll want to re-evaluate this when we provide an affordance for step configuration
const MAX_DATAPOINTS = DEFAULT_RESOLUTION * MAX_SERIES_TABLE;

/**
 * Result from executing a single query in a multi-query context
 */
interface LabeledQueryResult {
  label: string;
  response?: PromQLQueryResponse;
  error?: string;
  legendFormat?: string;
}

export const promqlSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  usage?: SearchUsage
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse> => {
  return {
    search: async (context, request: any, options) => {
      try {
        const { body: requestBody } = request;
        const { dataset, query, language }: Query = requestBody.query;
        const datasetId = dataset?.id ?? '';

        const requestOptions = requestBody.options as PromQLSearchOptions | undefined;
        const { maxDataPoints, perQueryOptions } = requestOptions ?? {};
        const isInstantQuery = requestOptions?.queryType?.toUpperCase() === 'INSTANT';

        const parsedQueries = splitMultiQueries(query as string);
        const isSingleQuery = parsedQueries.length === 1;
        const maxResults = Math.floor(MAX_DATAPOINTS / parsedQueries.length);
        const resolution = maxDataPoints && maxDataPoints > 0 ? maxDataPoints : DEFAULT_RESOLUTION;

        let shared: SharedExecOptions;
        let rangeMs = 0;

        if (isInstantQuery) {
          shared = {
            language,
            maxResults,
            timeout: 30,
            queryType: 'instant',
            time: parseTimeValue(requestOptions?.time).toString(),
          };
        } else {
          const start = parseTimeValue(requestBody.timeRange?.from);
          const end = parseTimeValue(requestBody.timeRange?.to, { roundUp: true });
          rangeMs = (end - start) * 1000;
          shared = {
            language,
            maxResults,
            timeout: 30,
            queryType: 'range',
            start: start.toString(),
            end: end.toString(),
          };
        }

        const plans: QueryPlan[] = parsedQueries.map((parsed, i) => {
          const opt = perQueryOptions?.[i];
          const { stepSec, scrapeSec, rateIntervalSec } = resolveStep({
            rangeMs,
            resolution,
            minStep: opt?.minStep,
            stepOverrideSec: requestOptions?.step,
          });
          return {
            label: parsed.label,
            query: interpolatePromQLMacros(parsed.query, { stepSec, rangeMs, scrapeSec }),
            step: stepSec.toString(),
            stepSec,
            rateIntervalSec,
            legendFormat: opt?.legendFormat,
            minStep: opt?.minStep,
          };
        });

        const queryResults = await executeMultipleQueries(
          context,
          request,
          plans,
          shared,
          datasetId,
          logger
        );

        // For single query, preserve fail-fast behavior
        if (isSingleQuery && queryResults[0]?.error) {
          throw new Error(queryResults[0].error);
        }

        const stepResolution: PromQLStepResolution | undefined = isInstantQuery
          ? undefined
          : {
              maxDataPoints: resolution,
              queries: plans.map(({ label, stepSec, rateIntervalSec, minStep }) => ({
                label,
                stepSec,
                rateIntervalSec,
                minStep,
              })),
            };

        const dataFrame = createDataFrame(queryResults, datasetId, isSingleQuery, stepResolution);

        return {
          type: DATA_FRAME_TYPES.DEFAULT,
          body: dataFrame,
        } as IDataFrameResponse;
      } catch (e: unknown) {
        const error = e as Error;
        logger.error(`promqlSearchStrategy: ${error.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};

interface QueryPlan {
  label: string;
  query: string;
  step: string;
  stepSec: number;
  rateIntervalSec: number;
  legendFormat?: string;
  minStep?: string;
}

type SharedExecOptions =
  | {
      language: string;
      maxResults: number;
      timeout: number;
      queryType: 'range';
      start: string;
      end: string;
    }
  | {
      language: string;
      maxResults: number;
      timeout: number;
      queryType: 'instant';
      time: string;
    };

/**
 * Executes multiple PromQL queries in parallel
 */
async function executeMultipleQueries(
  context: any,
  request: any,
  plans: QueryPlan[],
  shared: SharedExecOptions,
  datasetId: string,
  logger: Logger
): Promise<LabeledQueryResult[]> {
  const promises = plans.map(async (plan): Promise<LabeledQueryResult> => {
    const queryOptions: PromQLQueryParams['body']['options'] =
      shared.queryType === 'instant'
        ? { queryType: 'instant', time: shared.time }
        : {
            queryType: 'range',
            start: shared.start,
            end: shared.end,
            step: plan.step,
          };

    const params: PromQLQueryParams = {
      body: {
        query: plan.query,
        language: shared.language,
        maxResults: shared.maxResults,
        timeout: shared.timeout,
        options: queryOptions,
      },
      dataconnection: datasetId,
    };

    try {
      const queryRes = await prometheusManager.query(context, request, params);

      return {
        label: plan.label,
        response: queryRes,
        legendFormat: plan.legendFormat,
      };
    } catch (error) {
      let errorMessage = `Query ${plan.label} failed`;

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Try to extract detailed error from response body from SQL plugin
      const responseBody = (error as any)?.body ?? (error as any)?.response;
      if (responseBody) {
        try {
          const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
          errorMessage =
            parsed?.error?.details ??
            parsed?.error?.reason ??
            parsed?.error?.message ??
            errorMessage;
        } catch {
          // error might come from other places, use original message if failed
        }
      }

      return {
        label: plan.label,
        error: errorMessage,
        legendFormat: plan.legendFormat,
      };
    }
  });

  return Promise.all(promises);
}

/**
 * Formats metric labels into a string like {label1="value1", label2="value2"}
 * Only includes labels that have actual values (non-empty)
 */
function formatMetricLabels(metric: Record<string, string>): string {
  const labelParts = Object.entries(metric)
    .filter(([_, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}="${value}"`);

  return `{${labelParts.join(', ')}}`;
}

function distinguishingLabelKeysByTemplatedName(
  series: MetricResult[],
  legendTemplate: string
): Map<string, string[]> {
  const groups = new Map<string, Array<Record<string, string>>>();
  series.forEach((metricResult, seriesIndex) => {
    if (seriesIndex >= MAX_SERIES_TABLE) return;
    const name = interpolateLegendFormat(legendTemplate, metricResult.metric).trim();
    if (!name) return;
    const group = groups.get(name);
    if (group) group.push(metricResult.metric);
    else groups.set(name, [metricResult.metric]);
  });

  const distinguishing = new Map<string, string[]>();
  groups.forEach((members, name) => {
    if (members.length < 2) return;
    const keys = new Set<string>();
    members.forEach((labels) => Object.keys(labels).forEach((key) => keys.add(key)));
    distinguishing.set(
      name,
      Array.from(keys).filter((key) => new Set(members.map((labels) => labels[key] ?? '')).size > 1)
    );
  });
  return distinguishing;
}

/**
 * Unified DataFrame creation for single and multi-query results.
 * - Single query: uses `Value` column, simpler series names
 * - Multi-query: uses `Value #A`, `Value #B` columns, prefixed series names
 */
function createDataFrame(
  queryResults: LabeledQueryResult[],
  datasetId: string,
  isSingleQuery: boolean,
  stepResolution?: PromQLStepResolution
): IDataFrame {
  const allVizRows: Array<Record<string, unknown>> = [];
  const allLabelKeys = new Set<string>();
  let totalSeriesCount = 0;

  // instantDataMap is used for table display, we only show the latest datapoint in the table.
  const instantDataMap = new Map<
    string,
    {
      metric: Record<string, string>;
      metricName: string;
      time: number;
      valuesByQuery: Record<string, number>;
    }
  >();

  const queryLabels = queryResults.filter((r) => !r.error && r.response).map((r) => r.label);

  queryResults.forEach((result) => {
    if (!result.response || result.error) return;

    const queryResult = result.response.results[datasetId];
    const series = normalizeResult(queryResult?.resultType, queryResult?.result);
    totalSeriesCount += series.length;

    series.forEach((metricResult, i) => {
      if (i >= MAX_SERIES_TABLE) return;
      if (metricResult.metric) {
        Object.keys(metricResult.metric).forEach((key) => {
          if (key !== '__name__') {
            allLabelKeys.add(key);
          }
        });
      }
    });
  });

  const labelKeys = Array.from(allLabelKeys).sort();

  const seriesDisplayNames: Record<string, string> = {};

  queryResults.forEach((result) => {
    if (!result.response || result.error) return;

    const queryResult = result.response.results[datasetId];
    const series = normalizeResult(queryResult?.resultType, queryResult?.result);
    const legendTemplate = result.legendFormat?.trim() ? result.legendFormat : undefined;

    const distinguishingKeys = legendTemplate
      ? distinguishingLabelKeysByTemplatedName(series, legendTemplate)
      : new Map<string, string[]>();

    series.forEach((metricResult, seriesIndex) => {
      if (seriesIndex >= MAX_SERIES_TABLE) return;

      const metricName = metricResult.metric.__name__ || '';

      const labelsWithoutName = { ...metricResult.metric };
      delete labelsWithoutName.__name__;

      const fallbackName = `${metricName}${formatMetricLabels(labelsWithoutName)}`;
      const templatedName = legendTemplate
        ? interpolateLegendFormat(legendTemplate, metricResult.metric).trim()
        : '';

      const seriesName = isSingleQuery ? fallbackName : `${result.label}: ${fallbackName}`;
      // TODO: remove escaping if not using vega
      // Escape brackets in series name to prevent Vega's splitAccessPath from
      // interpreting them as array index notation when used as field names
      const escapedSeriesName = seriesName.replace(/\[/g, '\\[').replace(/\]/g, '\\]');

      if (templatedName) {
        seriesDisplayNames[escapedSeriesName] = templatedName;
      }

      const dataPoints = metricResult.values ?? (metricResult.value ? [metricResult.value] : []);

      dataPoints.forEach(([timestamp, value]) => {
        const metricSignature = JSON.stringify({
          name: metricName,
          labels: labelsWithoutName,
        });

        const existing = instantDataMap.get(metricSignature);
        const timeMs = timestamp * 1000;

        if (!existing || timeMs > existing.time) {
          instantDataMap.set(metricSignature, {
            metric: labelsWithoutName,
            metricName,
            time: timeMs,
            valuesByQuery: {
              ...(existing?.valuesByQuery || {}),
              [result.label]: Number(value),
            },
          });
        } else if (timeMs === existing.time) {
          existing.valuesByQuery[result.label] = Number(value);
        }

        if (seriesIndex < MAX_SERIES_TABLE) {
          allVizRows.push({
            Time: timeMs,
            Series: escapedSeriesName,
            Labels: labelsWithoutName,
            Value: Number(value),
          });
        }
      });
    });
  });

  const allInstantRows: Array<Record<string, unknown>> = [];

  instantDataMap.forEach((data) => {
    const row: Record<string, unknown> = {
      Time: data.time,

      Metric: data.metricName + formatMetricLabels(data.metric),
    };

    labelKeys.forEach((labelKey) => {
      const labelValue = data.metric[labelKey];
      row[labelKey] = labelValue !== undefined && labelValue !== '' ? labelValue : undefined;
    });

    if (isSingleQuery) {
      row.Value = data.valuesByQuery[queryLabels[0]] ?? null;
    } else {
      queryLabels.forEach((label) => {
        row[`Value #${label}`] = data.valuesByQuery[label] ?? null;
      });
    }

    allInstantRows.push(row);
  });

  const valueColumns = isSingleQuery
    ? [{ name: 'Value', type: 'number', values: [] }]
    : queryLabels.map((label) => ({ name: `Value #${label}`, type: 'number', values: [] }));

  const instantSchema = [
    { name: 'Time', type: 'time', values: [] },
    { name: 'Metric', type: 'string', values: [] },
    ...labelKeys.map((key) => ({ name: key, type: 'string', values: [] })),
    ...valueColumns,
  ];

  const vizSchema = [
    { name: 'Time', type: 'time', values: [] },
    { name: 'Series', type: 'string', values: [] },
    { name: 'Labels', type: 'object', values: [] },
    { name: 'Value', type: 'number', values: [] },
  ];

  const vizFields = vizSchema.map((s) => ({
    name: s.name,
    type: s.type as 'time' | 'string' | 'number',
    values: allVizRows.map((row) => row[s.name]),
  }));

  const errors = queryResults
    .filter((r) => r.error)
    .map((r) => ({ query: r.label, error: r.error }));

  const meta: Record<string, unknown> = {
    instantData: {
      schema: instantSchema,
      rows: allInstantRows,
    },
  };

  if (Object.keys(seriesDisplayNames).length > 0) {
    meta.seriesDisplayNames = seriesDisplayNames;
  }

  if (stepResolution) {
    meta.stepResolution = stepResolution;
  }

  const tableTruncated = totalSeriesCount > MAX_SERIES_TABLE;
  if (tableTruncated || totalSeriesCount > 0) {
    meta.truncation = {
      tableTruncated,
      totalSeriesCount,
      displayedSeriesCount: Math.min(totalSeriesCount, MAX_SERIES_TABLE),
    };
  }

  if (!isSingleQuery) {
    meta.multiQuery = {
      queryCount: queryResults.length,
      successCount: queryResults.filter((r) => !r.error).length,
      errors,
      queryLabels,
    };
  }

  return {
    type: DATA_FRAME_TYPES.DEFAULT,
    name: datasetId,
    schema: vizSchema,
    fields: vizFields,
    size: allVizRows.length,
    meta,
  };
}
