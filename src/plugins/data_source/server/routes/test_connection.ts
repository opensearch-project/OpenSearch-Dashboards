/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, OpenSearchClient } from 'opensearch-dashboards/server';
import { DataSourceAttributes } from '../../common/data_sources';
import { DataSourceConnectionValidator } from './data_source_connection_validator';
import { DataSourceServiceSetup } from '../data_source_service';
import { CryptographyServiceSetup } from '../cryptography_service';

export const registerTestConnectionRoute = (
  router: IRouter,
  dataSourceServiceSetup: DataSourceServiceSetup,
  cryptography: CryptographyServiceSetup
) => {
  router.post(
    {
      path: '/internal/data-source-management/validate',
      validate: {
        body: schema.object({
          id: schema.maybe(schema.string()),
          dataSourceAttr: schema.object({
            endpoint: schema.string(),
            auth: schema.maybe(
              schema.object({
                type: schema.oneOf([
                  schema.literal('username_password'),
                  schema.literal('no_auth'),
                ]),
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
        }),
      },
    },
    async (context, request, response) => {
      const { dataSourceAttr, id: dataSourceId } = request.body;

      try {
        const dataSourceClient: OpenSearchClient = await dataSourceServiceSetup.getTestingClient(
          {
            dataSourceId,
            savedObjects: context.core.savedObjects.client,
            cryptography,
          },
          dataSourceAttr as DataSourceAttributes
        );
        const dsValidator = new DataSourceConnectionValidator(dataSourceClient);

        await dsValidator.validate();

        return response.ok({
          body: {
            success: true,
          },
        });
      } catch (err) {
        return response.customError({
          statusCode: err.statusCode || 500,
          body: {
            message: err.message,
            attributes: {
              error: err.body?.error || err.message,
            },
          },
        });
      }
    }
  );
};
