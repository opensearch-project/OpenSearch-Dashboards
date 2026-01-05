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
} from '../../../data/common';
import {
  prometheusManager,
  PromQLQueryParams,
  PromQLQueryResponse,
} from '../connections/managers/prometheus_manager';

// This creates an upper bound for data points sent to the frontend (targetSamples * maxSeries)
const AUTO_STEP_TARGET_SAMPLES = 50;
const MAX_SERIES = 2000;
// We'll want to re-evaluate this when we provide an affordance for step configuration
const MAX_DATAPOINTS = AUTO_STEP_TARGET_SAMPLES * MAX_SERIES;

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
        // round to nearest ms step >= 1ms
        const step =
          requestBody.step ??
          Math.max(Math.ceil(duration / AUTO_STEP_TARGET_SAMPLES) / 1000, 0.001);
        const { dataset, query, language }: Query = requestBody.query;
        const datasetId = dataset?.id ?? '';
        const params: PromQLQueryParams = {
          body: {
            query: query as string,
            language: language as string,
            maxResults: MAX_DATAPOINTS,
            timeout: 30,
            options: {
              queryType: 'range',
              start: timeRange.start.toString(),
              end: timeRange.end.toString(),
              step: step.toString(),
            },
          },
          dataconnection: datasetId,
        };

        // Use prometheus manager for query execution - allows runtime override of client
        const queryRes = await prometheusManager.query(context, request, params);

        if (queryRes.status === 'failed') {
          throw new Error(queryRes.error || 'PromQL query failed');
        }

        const dataFrame = createDataFrame(queryRes.data, datasetId);

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
 * Transforms Prometheus response to visualization format DataFrame (Time, Series, Value)
 * and stores raw instant format (Time, labels..., Value) in meta for the metrics table
 */
function createDataFrame(rawResponse: PromQLQueryResponse, datasetId: string): IDataFrame {
  const series = rawResponse.results[datasetId]?.result || [];

  const allLabelKeys = new Set<string>();
  series.forEach((metricResult, i) => {
    if (i >= MAX_SERIES) return;
    if (metricResult.metric) {
      Object.keys(metricResult.metric).forEach((key) => {
        allLabelKeys.add(key);
      });
    }
  });

  const labelKeys = Array.from(allLabelKeys).sort();

  // Create instant format rows (Time, Metric, label1, label2, ..., Value)
  // Metric column contains the formatted metric string: metricName{label1="value1", label2="value2"}
  const rows: Array<Record<string, unknown>> = [];

  series.forEach((metricResult, seriesIndex) => {
    if (seriesIndex >= MAX_SERIES) return;

    const metricName = metricResult.metric.__name__ || '';
    const labelParts = labelKeys
      .filter((key) => key !== '__name__')
      .map((labelKey) => {
        const labelValue = metricResult.metric[labelKey];
        return labelValue ? `${labelKey}="${labelValue}"` : null;
      })
      .filter(Boolean);
    const metricString =
      labelParts.length > 0 ? `${metricName}{${labelParts.join(', ')}}` : metricName;

    metricResult.values.forEach(([timestamp, value]) => {
      const row: Record<string, unknown> = { Time: timestamp * 1000, Metric: metricString };
      labelKeys.forEach((labelKey) => (row[labelKey] = metricResult.metric[labelKey] || ''));
      row.Value = Number(value);
      rows.push(row);
    });
  });

  // Filter to only the latest timestamp for data-grid
  const latestTimestamp = Math.max(...rows.map((row) => (row.Time as number) || 0));
  const instantRows = rows.filter((row) => row.Time === latestTimestamp);

  const instantSchema = [
    { name: 'Time', type: 'time', values: [] },
    { name: 'Metric', type: 'string', values: [] },
    ...labelKeys.map((key) => ({ name: key, type: 'string', values: [] })),
    { name: 'Value', type: 'number', values: [] },
  ];

  // Create visualization format rows (Time, Series, Value)
  const vizRows: Array<Record<string, unknown>> = [];

  series.forEach((metricResult, seriesIndex) => {
    if (seriesIndex >= MAX_SERIES) return;

    metricResult.values.forEach(([timestamp, value]) => {
      // Build series name from labels like: {cpu="0", mode="idle", instance="..."}
      const labelParts = labelKeys
        .map((labelKey) => {
          const labelValue = metricResult.metric[labelKey];
          return labelValue ? `${labelKey}="${labelValue}"` : null;
        })
        .filter(Boolean);

      const seriesName = labelParts.length > 0 ? `{${labelParts.join(', ')}}` : '';

      vizRows.push({
        Time: timestamp * 1000,
        Series: seriesName,
        Value: Number(value),
      });
    });
  });

  const vizSchema = [
    { name: 'Time', type: 'time', values: [] },
    { name: 'Series', type: 'string', values: [] },
    { name: 'Value', type: 'number', values: [] },
  ];

  const vizFields = vizSchema.map((s) => ({
    name: s.name,
    type: s.type as 'time' | 'string' | 'number',
    values: vizRows.map((row) => row[s.name]),
  }));

  return {
    type: DATA_FRAME_TYPES.DEFAULT,
    name: datasetId,
    schema: vizSchema,
    fields: vizFields,
    size: vizRows.length,
    meta: {
      instantData: {
        schema: instantSchema,
        rows: instantRows,
      },
    },
  };
}
