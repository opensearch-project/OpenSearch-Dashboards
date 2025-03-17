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

// Query 500 samples by default
const TARGET_SAMPLES = 500;

interface MetricResult {
  metric: Record<string, string>;
  values: Array<[number, number]>;
}

interface PrometheusResponse {
  queryId: string;
  sessionId: string;
  results: {
    [connectionId: string]: {
      data: {
        resultType: string;
        result: MetricResult[];
      };
    };
  };
}

const DATA_CONNECTION = 'my_prometheus'; // TODO: update based on data connection saved object response

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
        const duration = timeRange.end - timeRange.start;
        const step = Math.floor(duration / TARGET_SAMPLES);
        const { dataset, query, language }: Query = requestBody.query;
        const dataSource = dataset?.dataSource;
        const params = {
          body: {
            query,
            language,
            maxResults: 1000,
            timeout: 30,
            sessionId: '1234', // TODO: use appropriate session id
            options: {
              queryType: 'range',
              start: timeRange.start.toString(),
              end: timeRange.end.toString(),
              step: step.toString(),
            },
          },
          dataconnection: DATA_CONNECTION,
        };

        const clientId = dataSource?.id;
        const queryClient = clientId
          ? context.dataSource.opensearch.legacy.getClient(clientId).callAPI
          : client.asScoped(request).callAsCurrentUser;
        const queryRes = (await queryClient(
          'enhancements.promqlQuery',
          params
        )) as PrometheusResponse;

        const dataFrame = createDataFrame(queryRes);

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

function createDataFrame(rawResponse: PrometheusResponse) {
  const series = rawResponse.results[DATA_CONNECTION].data.result;
  const initDataFrame: IDataFrame = {
    type: DATA_FRAME_TYPES.DEFAULT,
    name: DATA_CONNECTION,
    schema: [{ name: 'Time', type: 'time', values: [] }],
    fields: [{ name: 'Time', type: 'time', values: series[0].values.map((v) => v[0] * 1000) }],
    size: 0,
  };

  const df = series.reduce((acc, metricResult, i) => {
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
