/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { ISearchStrategy, SearchUsage } from '../../../data/server';
import {
  DATA_FRAME_TYPES,
  IDataFrame,
  IDataFrameResponse,
  IOpenSearchDashboardsSearchRequest,
  Query,
} from '../../../data/common';

interface PrometheusResponse {
  queryId: string;
  result: string;
  sessionId: string;
}

interface MetricResult {
  metric: Record<string, string>;
  values: Array<[number, number]>;
}

interface PrometheusResult {
  data: {
    result: MetricResult[];
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
              start: '1741124895',
              end: '1741128495',
              step: '14', // TODO: determine appropriate steps
            },
          },
          dataconnection: 'my_prometheus',
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
  const result = JSON.parse(rawResponse.result) as PrometheusResult;
  const series = result.data.result;
  const initDataFrame: IDataFrame = {
    type: DATA_FRAME_TYPES.DEFAULT,
    name: 'mock prometheus data',
    schema: [{ name: 'Time', type: 'time', values: [] }],
    fields: [{ name: 'Time', type: 'time', values: series[0].values.map((v) => v[0]) }],
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
