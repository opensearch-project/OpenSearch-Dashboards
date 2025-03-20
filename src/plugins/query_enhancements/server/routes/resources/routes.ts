/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { ILegacyClusterClient, IRouter } from 'opensearch-dashboards/server';
import {
  prometheusManager,
  PrometheusResourceQuery,
} from '../../connections/managers/prometheus_manager';
import { BASE_API } from '../../../common';

export function registerResourceRoutes(router: IRouter, defaultClient: ILegacyClusterClient) {
  router.get(
    {
      path: `${BASE_API}/{dataConnectionType}/{dataConnectionId}/resources/{resourceType}/{resourceName?}`,
      validate: {
        params: schema.object({
          dataConnectionType: schema.oneOf([
            schema.literal('prometheus'),
            schema.literal('cloudwatch'),
          ]),
          dataConnectionId: schema.string(), // this is the DQS datasource name, which is unique
          resourceType: schema.oneOf([
            schema.literal('labels'),
            schema.literal('label_values'),
            schema.literal('metric_metadata'),
            schema.literal('alerts'),
          ]),
          resourceName: schema.maybe(schema.string()),
        }),
        query: schema.object({}, { unknowns: 'allow' }),
      },
    },
    async (context, request, response) => {
      const { dataConnectionId, dataConnectionType, resourceType, resourceName } = request.params;
      if (dataConnectionType === 'prometheus') {
        const resourcesResponse = await prometheusManager.getResources(context, request, {
          dataSourceName: dataConnectionId,
          resourceType,
          resourceName,
          query: request.query,
        } as PrometheusResourceQuery);

        if (resourcesResponse.status === 'failed') {
          return response.internalError();
        }

        return response.ok({ body: resourcesResponse }) as any;
      }
    }
  );
}
