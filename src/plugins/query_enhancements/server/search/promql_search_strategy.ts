/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
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

// This creates an upper bound for data points sent to the frontend (targetSamples * maxSeries)
const AUTO_STEP_TARGET_SAMPLES = 50;
const MAX_SERIES = 20;
// We'll want to re-evaluate this when we provide an affordance for step configuration
const MAX_DATAPOINTS = AUTO_STEP_TARGET_SAMPLES * MAX_SERIES;

interface MetricResult {
  metric: Record<string, string>;
  values: Array<[number, number]>;
}

interface PrometheusResponse {
  queryId: string;
  sessionId: string;
  results: {
    [connectionId: string]: {
      resultType: string;
      result: MetricResult[];
    };
  };
}

export const promqlSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient,
  usage?: SearchUsage
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse> => {
  return {
    search: async (context, request: any, options) => {
      try {
        const { body: requestBody } = request;
        const timeRange = {
          start: dateMath.parse(requestBody.timeRange.from)!.unix(),
          end: dateMath.parse(requestBody.timeRange.to, { roundUp: true })!.unix(),
        };
        const duration = (timeRange.end - timeRange.start) * 1000;
        // round to nearest ms step >= 1ms
        const step =
          requestBody.step ??
          Math.max(Math.ceil(duration / AUTO_STEP_TARGET_SAMPLES) / 1000, 0.001);
        const { dataset, query, language }: Query = requestBody.query;
        const datasetId = dataset?.id ?? '';
        const params = {
          body: {
            query,
            language,
            maxResults: MAX_DATAPOINTS,
            timeout: 30,
            sessionId: '1234', // TODO: use appropriate session id
            options: {
              queryType: 'range',
              start: timeRange.start.toString(),
              end: timeRange.end.toString(),
              step: step.toString(),
            },
          },
          dataconnection: datasetId,
        };

        const queryClient = client.asScoped(request).callAsCurrentUser;
        const queryRes = (await queryClient(
          'enhancements.promqlQuery',
          params
        )) as PrometheusResponse;

        const dataFrame = createDataFrame(queryRes, datasetId);

        return {
          type: DATA_FRAME_TYPES.DEFAULT,
          body: dataFrame,
        } as IDataFrameResponse;
      } catch (e) {
        logger.error(`promqlSearchStrategy: ${e.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};

/**
 * we'll need to model this transformation more robustly and remove some
 * of the structural assumptions here moving past kubecon demo
 */
function createDataFrame(rawResponse: PrometheusResponse, datasetId: string) {
  try {
    const series = rawResponse.results[datasetId].result;
    const initDataFrame: IDataFrame = {
      type: DATA_FRAME_TYPES.DEFAULT,
      name: datasetId,
      schema: [{ name: 'Time', type: 'time', values: [] }],
      fields: [{ name: 'Time', type: 'time', values: series[0].values.map((v) => v[0] * 1000) }],
      size: 0,
    };

    const df = series.reduce((acc, metricResult, i) => {
      if (i >= MAX_SERIES) {
        return acc;
      }

      const schema = getFieldSchema(metricResult);
      acc.schema?.push(schema);
      acc.fields?.push({
        ...schema,
        values: metricResult.values.map((v) => Number(v[1])),
      });
      return acc;
    }, initDataFrame);

    df.size = df.fields[0].values.length;

    return initDataFrame;
  } catch (err) {
    return {};
  }
}

function getFieldSchema(metricResult: MetricResult) {
  let name = '';
  if (metricResult.metric) {
    const metricLength = Object.keys(metricResult.metric).length;
    Object.entries(metricResult.metric).forEach(([key, val], i) => {
      if (key === '__name__') return;
      name += `${key}="${val}"`;
      if (i !== metricLength - 1) {
        name += ', ';
      }
    });
    name = `{${name}}`;
  }

  return {
    name,
    type: 'number',
    values: [],
  };
}
