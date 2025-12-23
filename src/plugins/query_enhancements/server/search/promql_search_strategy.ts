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
  ParsedQuery,
  Query,
  splitMultiQueries,
} from '../../../data/common';
import {
  prometheusManager,
  PromQLQueryParams,
  PromQLQueryResponse,
} from '../connections/managers/prometheus_manager';

// This creates an upper bound for data points sent to the frontend (targetSamples * maxSeries)
const AUTO_STEP_TARGET_SAMPLES = 50;
const MAX_SERIES = 100;
// We'll want to re-evaluate this when we provide an affordance for step configuration
const MAX_DATAPOINTS = AUTO_STEP_TARGET_SAMPLES * MAX_SERIES;

/**
 * Result from executing a single query in a multi-query context
 */
interface LabeledQueryResult {
  label: string;
  response?: PromQLQueryResponse;
  error?: string;
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
        const parsedFrom = dateMath.parse(requestBody.timeRange.from);
        const parsedTo = dateMath.parse(requestBody.timeRange.to, { roundUp: true });
        if (!parsedFrom || !parsedTo) {
          throw new Error('Invalid time range format');
        }
        const timeRange = {
          start: parsedFrom.unix(),
          end: parsedTo.unix(),
        };
        const duration = (timeRange.end - timeRange.start) * 1000;
        const step =
          requestBody.step ??
          Math.max(Math.ceil(duration / AUTO_STEP_TARGET_SAMPLES) / 1000, 0.001);
        const { dataset, query, language }: Query = requestBody.query;
        const datasetId = dataset?.id ?? '';

        const parsedQueries = splitMultiQueries(query as string);
        const isSingleQuery = parsedQueries.length === 1;

        // Execute all queries uniformly
        const queryResults = await executeMultipleQueries(
          context,
          request,
          parsedQueries,
          {
            language,
            maxResults: Math.floor(MAX_DATAPOINTS / parsedQueries.length),
            timeout: 30,
            timeRange,
            step: step.toString(),
          },
          datasetId,
          logger
        );

        // For single query, preserve fail-fast behavior
        if (isSingleQuery && queryResults[0]?.error) {
          throw new Error(queryResults[0].error);
        }

        const dataFrame = createDataFrame(queryResults, datasetId, isSingleQuery);

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

/**
 * Executes multiple PromQL queries in parallel
 */
async function executeMultipleQueries(
  context: any,
  request: any,
  queries: ParsedQuery[],
  options: {
    language: string;
    maxResults: number;
    timeout: number;
    timeRange: { start: number; end: number };
    step: string;
  },
  datasetId: string,
  logger: Logger
): Promise<LabeledQueryResult[]> {
  const promises = queries.map(
    async (parsedQuery): Promise<LabeledQueryResult> => {
      try {
        const params: PromQLQueryParams = {
          body: {
            query: parsedQuery.query,
            language: options.language,
            maxResults: options.maxResults,
            timeout: options.timeout,
            options: {
              queryType: 'range',
              start: options.timeRange.start.toString(),
              end: options.timeRange.end.toString(),
              step: options.step,
            },
          },
          dataconnection: datasetId,
        };

        const queryRes = await prometheusManager.query(context, request, params);

        if (queryRes.status === 'failed') {
          return {
            label: parsedQuery.label,
            error: queryRes.error || `Query ${parsedQuery.label} failed`,
          };
        }

        return {
          label: parsedQuery.label,
          response: queryRes.data,
        };
      } catch (e: unknown) {
        const error = e as Error;
        logger.error(`Query ${parsedQuery.label} failed: ${error.message}`);
        return {
          label: parsedQuery.label,
          error: error.message,
        };
      }
    }
  );

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

  return labelParts.length > 0 ? `{${labelParts.join(', ')}}` : '';
}

/**
 * Unified DataFrame creation for single and multi-query results.
 * - Single query: uses `Value` column, simpler series names
 * - Multi-query: uses `Value #A`, `Value #B` columns, prefixed series names
 */
function createDataFrame(
  queryResults: LabeledQueryResult[],
  datasetId: string,
  isSingleQuery: boolean
): IDataFrame {
  const allVizRows: Array<Record<string, unknown>> = [];
  const allLabelKeys = new Set<string>();

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

    const series = result.response.results[datasetId]?.result || [];

    series.forEach((metricResult, i) => {
      if (i >= MAX_SERIES) return;
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

  queryResults.forEach((result) => {
    if (!result.response || result.error) return;

    const series = result.response.results[datasetId]?.result || [];

    series.forEach((metricResult, seriesIndex) => {
      if (seriesIndex >= MAX_SERIES) return;

      const metricName = metricResult.metric.__name__ || '';

      const labelsWithoutName = { ...metricResult.metric };
      delete labelsWithoutName.__name__;

      metricResult.values.forEach(([timestamp, value]) => {
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

        const formattedLabels = formatMetricLabels(metricResult.metric);

        const seriesName = isSingleQuery ? formattedLabels : `${result.label}: ${formattedLabels}`;

        allVizRows.push({
          Time: timeMs,
          Series: seriesName,
          Value: Number(value),
        });
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
