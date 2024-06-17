/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, OpenSearchClient } from 'opensearch-dashboards/server';
import { AuthType, DataSourceAttributes, SigV4ServiceName } from '../../common/data_sources';
import { DataSourceConnectionValidator } from './data_source_connection_validator';
import { DataSourceServiceSetup } from '../data_source_service';
import { CryptographyServiceSetup } from '../cryptography_service';
import { IAuthenticationMethodRegistry } from '../auth_registry';
import { CustomApiSchemaRegistry } from '../schema_registry/custom_api_schema_registry';

export const registerFetchDataSourceMetaDataRoute = async (
  router: IRouter,
  dataSourceServiceSetup: DataSourceServiceSetup,
  cryptography: CryptographyServiceSetup,
  authRegistryPromise: Promise<IAuthenticationMethodRegistry>,
  customApiSchemaRegistryPromise: Promise<CustomApiSchemaRegistry>
) => {
  const authRegistry = await authRegistryPromise;
  router.post(
    {
      path: '/internal/data-source-management/fetchDataSourceMetaData',
      validate: {
        body: schema.object({
          id: schema.maybe(schema.string()),
          dataSourceAttr: schema.object({
            endpoint: schema.string(),
            auth: schema.maybe(
              schema.oneOf([
                schema.object({
                  type: schema.literal(AuthType.NoAuth),
                  credentials: schema.object({}),
                }),
                schema.object({
                  type: schema.literal(AuthType.UsernamePasswordType),
                  credentials: schema.object({
                    username: schema.string(),
                    password: schema.string(),
                  }),
                }),
                schema.object({
                  type: schema.literal(AuthType.SigV4),
                  credentials: schema.object({
                    region: schema.string(),
                    accessKey: schema.string(),
                    secretKey: schema.string(),
                    service: schema.oneOf([
                      schema.literal(SigV4ServiceName.OpenSearch),
                      schema.literal(SigV4ServiceName.OpenSearchServerless),
                    ]),
                  }),
                }),
                schema.object({
                  type: schema.string({
                    validate: (value) => {
                      if (
                        value === AuthType.NoAuth ||
                        value === AuthType.UsernamePasswordType ||
                        value === AuthType.SigV4
                      ) {
                        return `Must not be no_auth or username_password or sigv4 for registered auth types`;
                      }
                    },
                  }),
                  credentials: schema.nullable(schema.any()),
                }),
              ])
            ),
          }),
        }),
      },
    },
    async (context, request, response) => {
      const { dataSourceAttr, id: dataSourceId } = request.body;

      try {
        const dataSourceClient: OpenSearchClient = await dataSourceServiceSetup.getDataSourceClient(
          {
            savedObjects: context.core.savedObjects.client,
            cryptography,
            dataSourceId,
            testClientDataSourceAttr: dataSourceAttr as DataSourceAttributes,
            request,
            authRegistry,
            customApiSchemaRegistryPromise,
          }
        );

        const dataSourceValidator = new DataSourceConnectionValidator(
          dataSourceClient,
          dataSourceAttr
        );

        const dataSourceInfo = await dataSourceValidator.fetchDataSourceInfo();
        const dataSourceVersion = dataSourceInfo.dataSourceVersion;
        const dataSourceEngineType = dataSourceInfo.dataSourceEngineType;
        const installedPlugins = Array.from(await dataSourceValidator.fetchInstalledPlugins());

        return response.ok({
          body: {
            dataSourceVersion,
            dataSourceEngineType,
            installedPlugins,
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
