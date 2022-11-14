/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, OpenSearchClient } from 'opensearch-dashboards/server';
import { DataSourcePluginConfigType } from '../../config';
import { getValidationClient, getRootClient, OpenSearchClientPoolSetup } from '../client';
import { DataSourceAttributes } from '../../common/data_sources';
import { DataSourceConnectionValidator } from './data_source_connection_validator';

export const registerTestConnection = (
  router: IRouter,
  config: DataSourcePluginConfigType,
  { getClientFromPool, addClientToPool }: OpenSearchClientPoolSetup
) => {
  router.post(
    {
      path: '/internal/data-source-management/validate',
      validate: {
        body: schema.object({
          endpoint: schema.string(),
          auth: schema.maybe(
            schema.object({
              type: schema.oneOf([schema.literal('username_password'), schema.literal('no_auth')]),
              credentials: schema.oneOf([
                schema.object({
                  username: schema.string(),
                  password: schema.string(),
                }),
                schema.literal(null),
              ]),
            })
          ),
        }),
      },
    },
    async (context, request, response) => {
      const dataSource: DataSourceAttributes = request.body as DataSourceAttributes;

      // Reuse the client cache in configure_client.ts, but require some refactor
      const rootClient = getRootClient(dataSource, config, { getClientFromPool, addClientToPool });
      const dataSourceClient: OpenSearchClient = await getValidationClient(rootClient, dataSource);

      const dsValidator = new DataSourceConnectionValidator(dataSourceClient);

      await dsValidator.validate();

      return response.ok({
        body: {
          success: true,
          msg: 'hello mani',
        },
      });
    }
  );
};
