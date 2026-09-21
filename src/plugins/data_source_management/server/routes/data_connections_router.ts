/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */
import { schema } from '@osd/config-schema';
import {
  IOpenSearchDashboardsResponse,
  IRouter,
  ResponseError,
  Logger,
} from '../../../../../src/core/server';
import { DataConnectionType } from '../../../data_source/common/data_connections';
import {
  DATACONNECTIONS_BASE,
  DATACONNECTIONS_UPDATE_STATUS,
  EDIT,
} from '../../framework/utils/shared';

// OAuth2 helper functions
import {
  mapPrometheusProperties,
  isOAuth2Prometheus,
  createOAuth2PrometheusDataSource,
  createOAuth2SavedObject,
  rollbackBackendCreation,
  listOAuth2PrometheusConnections,
  findOAuth2PrometheusConnection,
} from './oauth2_prometheus_connections';

export function registerNonMdsDataConnectionsRoute(router: IRouter) {
  router.get(
    {
      path: `${DATACONNECTIONS_BASE}/{name}`,
      validate: {
        params: schema.object({
          name: schema.string(),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      try {
        const dataConnectionsresponse =
          // @ts-expect-error TS2339 TODO(ts-error): fixme
          await context.opensearch_data_source_management.dataSourceManagementClient
            .asScoped(request)
            .callAsCurrentUser('ppl.getDataConnectionById', {
              dataconnection: request.params.name,
            });
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in fetching data connection:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.delete(
    {
      path: `${DATACONNECTIONS_BASE}/{name}`,
      validate: {
        params: schema.object({
          name: schema.string(),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      try {
        const dataConnectionsresponse =
          // @ts-expect-error TS2339 TODO(ts-error): fixme
          await context.opensearch_data_source_management.dataSourceManagementClient
            .asScoped(request)
            .callAsCurrentUser('ppl.deleteDataConnection', {
              dataconnection: request.params.name,
            });
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in deleting data connection:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.post(
    {
      path: `${DATACONNECTIONS_BASE}${EDIT}`,
      validate: {
        body: schema.object({
          name: schema.string(),
          allowedRoles: schema.arrayOf(schema.string()),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      try {
        const dataConnectionsresponse =
          // @ts-expect-error TS2339 TODO(ts-error): fixme
          await context.opensearch_data_source_management.dataSourceManagementClient
            .asScoped(request)
            .callAsCurrentUser('ppl.modifyDataConnection', {
              body: {
                name: request.body.name,
                allowedRoles: request.body.allowedRoles,
              },
            });
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in modifying data connection:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.post(
    {
      path: `${DATACONNECTIONS_BASE}${EDIT}${DATACONNECTIONS_UPDATE_STATUS}`,
      validate: {
        body: schema.object({
          name: schema.string(),
          status: schema.string(),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      try {
        const dataConnectionsresponse =
          // @ts-expect-error TS2339 TODO(ts-error): fixme
          await context.opensearch_data_source_management.dataSourceManagementClient
            .asScoped(request)
            .callAsCurrentUser('ppl.modifyDataConnection', {
              body: {
                name: request.body.name,
                status: request.body.status,
              },
            });
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in modifying data connection:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.get(
    {
      path: `${DATACONNECTIONS_BASE}`,
      validate: false,
    },
    async (context, request, response): Promise<any> => {
      try {
        const dataConnectionsresponse =
          // @ts-expect-error TS2339 TODO(ts-error): fixme
          await context.opensearch_data_source_management.dataSourceManagementClient
            .asScoped(request)
            .callAsCurrentUser('ppl.getDataConnections');
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in fetching data sources:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.response,
        });
      }
    }
  );
}

export function registerDataConnectionsRoute(
  router: IRouter,
  dataSourceEnabled: boolean,
  logger: Logger,
  // Defaults to true so existing callers and tests keep working; the DSM plugin passes the
  // real data_source.authTypes.OAuth2.enabled value.
  oauth2AuthEnabled: boolean = true
) {
  router.post(
    {
      path: `${DATACONNECTIONS_BASE}`,
      validate: {
        body: schema.object({
          name: schema.string(),
          connector: schema.string(),
          allowedRoles: schema.arrayOf(schema.string()),
          properties: schema.any(),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        // Map frontend properties to backend property names for Prometheus
        let mappedProperties = request.body.properties;
        if (request.body.connector === 'prometheus') {
          mappedProperties = mapPrometheusProperties(request.body.properties, logger);
        }
        // Check if this is an OAuth2 Prometheus data source and handle it separately
        if (isOAuth2Prometheus(request.body.connector, request.body.properties, mappedProperties)) {
          // Enforce the kill switch server side. Hiding the option in the browser is not
          // enough - this route is a public API and would otherwise still create a working
          // OAuth2 connection with OAuth2 turned off org-wide.
          if (!oauth2AuthEnabled) {
            return response.custom({
              statusCode: 400,
              body: {
                message:
                  'OAuth2 authentication is disabled. Set data_source.authTypes.OAuth2.enabled to true to create OAuth2 data connections.',
              },
            });
          }

          const client =
            // @ts-expect-error TS2339 TODO(ts-error): fixme
            context.opensearch_data_source_management.dataSourceManagementClient.asScoped(
              request
            ).callAsCurrentUser;

          // Create the OAuth2 Prometheus data source
          const dataConnectionsresponse = await createOAuth2PrometheusDataSource(
            client,
            request.body,
            mappedProperties,
            logger
          );

          // Create saved object for OAuth2 configuration storage
          if (dataSourceEnabled) {
            try {
              await createOAuth2SavedObject(
                context.core.savedObjects.client,
                request.body,
                mappedProperties,
                logger
              );
            } catch (savedObjectError) {
              // Roll back the backend creation to maintain consistency
              const rollbackResult = await rollbackBackendCreation(
                client,
                request.body.name,
                logger
              );

              if (!rollbackResult.success) {
                // Rollback failed - create a compound error message
                const compoundError = new Error(
                  `OAuth2 data source creation failed: ${savedObjectError.message}. ` +
                    `Additionally, rollback of backend data source failed: ${
                      rollbackResult.error?.message || 'Unknown rollback error'
                    }. ` +
                    `Manual cleanup may be required for data source '${request.body.name}'.`
                );
                throw compoundError;
              }

              throw savedObjectError;
            }
          }

          return response.ok({ body: dataConnectionsresponse });
        }

        // For non-OAuth2 data sources, use the normal backend flow
        const client =
          // @ts-expect-error TS2339 TODO(ts-error): fixme
          context.opensearch_data_source_management.dataSourceManagementClient.asScoped(
            request
          ).callAsCurrentUser;

        const dataConnectionsresponse = await client('ppl.createDataSource', {
          body: {
            name: request.body.name,
            connector: request.body.connector,
            allowedRoles: request.body.allowedRoles,
            properties: mappedProperties,
          },
        });

        // Create data-connection saved object for Prometheus datasources
        if (dataSourceEnabled && request.body.connector === 'prometheus') {
          await context.core.savedObjects.client.create('data-connection', {
            connectionId: request.body.name,
            type: DataConnectionType.Prometheus,
          });
        }

        return response.ok({ body: dataConnectionsresponse });
      } catch (error: any) {
        console.error('Issue in creating data source:', error);

        // Ensure we always provide a proper error message
        const statusCode = error.statusCode || 500;
        let errorBody = error.response || error.body || error.message || 'Unknown error occurred';

        // If errorBody is a string, wrap it in an object with message property
        if (typeof errorBody === 'string') {
          errorBody = { message: errorBody };
        }

        // Ensure the error object has a message property
        if (typeof errorBody === 'object' && !errorBody.message) {
          errorBody.message = error.message || 'Unknown error occurred';
        }

        return response.custom({
          statusCode,
          body: errorBody,
        });
      }
    }
  );

  router.get(
    {
      path: `${DATACONNECTIONS_BASE}/dataSourceMDSId={dataSourceMDSId?}`,
      validate: {
        params: schema.object({
          dataSourceMDSId: schema.maybe(schema.string({ defaultValue: '' })),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      const dataSourceMDSId = request.params.dataSourceMDSId;
      try {
        let dataConnectionsresponse: any;
        // Only for the local cluster. These connections live in this Dashboards instance's own
        // saved objects and carry no cluster association, so returning them for a remote
        // dataSourceMDSId would list the same connection under every data source and repeat the
        // saved-object scan and the roles lookup once per data source.
        const oauth2DataSources =
          dataSourceEnabled && !dataSourceMDSId
            ? await listOAuth2PrometheusConnections(context, logger)
            : [];

        // Get regular data sources from backend
        try {
          if (dataSourceEnabled && dataSourceMDSId) {
            const client = await context.dataSource.opensearch.legacy.getClient(dataSourceMDSId);
            dataConnectionsresponse = await client.callAPI('ppl.getDataConnections', {
              requestTimeout: 5000, // Enforce timeout to avoid hanging requests
            });
          } else {
            dataConnectionsresponse =
              // @ts-expect-error TS2339 TODO(ts-error): fixme
              await context.opensearch_data_source_management.dataSourceManagementClient
                .asScoped(request)
                .callAsCurrentUser('ppl.getDataConnections');
          }
        } catch (error) {
          // A permissions failure must not look like "no connections". Anything that says the
          // caller or the request was rejected is rethrown so the outer handler reports it;
          // only unavailability is absorbed, which is what lets the OAuth2 connections in
          // saved objects still render while the backend is down.
          const statusCode = error.statusCode ?? error.body?.statusCode;
          if (statusCode === 401 || statusCode === 403) {
            throw error;
          }
          logger.warn(
            `Backend data sources fetch failed, returning saved-object connections only: ${error.message}`
          );
          dataConnectionsresponse = [];
        }

        // Combine backend data sources with OAuth2 data sources, avoiding duplicates
        let backendDataSources: any[] = [];
        if (Array.isArray(dataConnectionsresponse)) {
          backendDataSources = dataConnectionsresponse;
        } else if (dataConnectionsresponse) {
          // Dropping a non-array silently would make every backend connection vanish from
          // the UI with no trace, so say so.
          logger.warn(
            `Unexpected ppl.getDataConnections response shape (${typeof dataConnectionsresponse}); ignoring backend connections`
          );
        }

        // Filter out OAuth2 data sources from backend response to avoid duplicates
        // (OAuth2 sources exist in both backend and saved objects)
        const oauth2Names = new Set(oauth2DataSources.map((ds) => ds.name));
        const backendOnly = backendDataSources.filter((ds) => !oauth2Names.has(ds.name));

        // Always an array: getDirectQueryConnections rejects any other shape, so switching
        // to an object on backend failure would surface as "Unexpected response format"
        // and lose the OAuth2 connections this merge exists to show.
        return response.ok({
          body: [...backendOnly, ...oauth2DataSources],
        });
      } catch (error: any) {
        console.error('Issue in fetching data sources:', error);
        const statusCode = error.statusCode || error.body?.statusCode || 500;
        const errorBody = error.body ||
          error.response || { message: error.message || 'Unknown error occurred' };

        return response.custom({
          statusCode,
          body: {
            error: errorBody,
            message: errorBody.message || error.message,
          },
        });
      }
    }
  );

  router.get(
    {
      path: `${DATACONNECTIONS_BASE}/{name}/dataSourceMDSId={dataSourceMDSId?}`,
      validate: {
        params: schema.object({
          name: schema.string(),
          dataSourceMDSId: schema.maybe(schema.string({ defaultValue: '' })),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      const dataSourceMDSId = request.params.dataSourceMDSId;
      try {
        let dataConnectionsresponse;

        // OAuth2 connections live in this instance's saved objects and are not scoped to a
        // cluster, so only the local cluster resolves them; a remote lookup falls through to
        // that cluster's backend.
        if (dataSourceEnabled && !dataSourceMDSId) {
          const oauth2Connection = await findOAuth2PrometheusConnection(
            context,
            request.params.name,
            logger
          );
          if (oauth2Connection) {
            return response.ok({ body: oauth2Connection });
          }
        }

        // If not found in saved objects or not OAuth2, try backend

        if (dataSourceEnabled && dataSourceMDSId) {
          const client = await context.dataSource.opensearch.legacy.getClient(dataSourceMDSId);
          dataConnectionsresponse = await client.callAPI('ppl.getDataConnectionById', {
            dataconnection: request.params.name,
          });
        } else {
          dataConnectionsresponse =
            // @ts-expect-error TS2339 TODO(ts-error): fixme
            await context.opensearch_data_source_management.dataSourceManagementClient
              .asScoped(request)
              .callAsCurrentUser('ppl.getDataConnectionById', {
                dataconnection: request.params.name,
              });
        }
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in fetching data sources:', error);
        const statusCode = error.statusCode || error.body?.statusCode || 500;
        const errorBody = error.body ||
          error.response || { message: error.message || 'Unknown error occurred' };

        return response.custom({
          statusCode,
          body: {
            error: errorBody,
            message: errorBody.message || error.message,
          },
        });
      }
    }
  );

  router.delete(
    {
      path: `${DATACONNECTIONS_BASE}/{name}/dataSourceMDSId={dataSourceMDSId?}`,
      validate: {
        params: schema.object({
          name: schema.string(),
          dataSourceMDSId: schema.maybe(schema.string({ defaultValue: '' })),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      const dataSourceMDSId = request.params.dataSourceMDSId;
      try {
        if (dataSourceEnabled && dataSourceMDSId) {
          const client = context.dataSource.opensearch.legacy.getClient(dataSourceMDSId);
          await client.callAPI('ppl.deleteDataConnection', {
            dataconnection: request.params.name,
          });
        } else {
          const dataConnectionsresponse =
            // @ts-expect-error TS2339 TODO(ts-error): fixme
            await context.opensearch_data_source_management.dataSourceManagementClient
              .asScoped(request)
              .callAsCurrentUser('ppl.deleteDataConnection', {
                dataconnection: request.params.name,
              });
          if (!dataSourceEnabled) {
            return response.ok({
              body: dataConnectionsresponse,
            });
          }
        }
      } catch (error: any) {
        const statusCode = error.statusCode || error.body?.statusCode || 500;

        if (statusCode !== 404) {
          console.error('Issue in deleting data connection from backend:', error);
          const errorBody = error.body ||
            error.response || { message: error.message || 'Unknown error occurred' };

          return response.custom({
            statusCode,
            body: {
              error: errorBody,
              message: errorBody.message || error.message,
            },
          });
        }
        console.log('Backend data connection not found, proceeding with saved object deletion');
      }

      try {
        const savedObjects = await context.core.savedObjects.client.find({
          type: 'data-connection',
          search: request.params.name,
          searchFields: ['connectionId'],
          perPage: 10000, // Set high limit to avoid silent truncation
        });

        // Filter for exact match to prevent fuzzy search issues
        const exactMatch = savedObjects.saved_objects.find((obj) => {
          const attributes = obj.attributes as any;
          return attributes.connectionId === request.params.name;
        });

        if (exactMatch) {
          await context.core.savedObjects.client.delete('data-connection', exactMatch.id);
        }

        return response.ok({
          body: { success: true, deleted: request.params.name },
        });
      } catch (error: any) {
        console.error('Issue in deleting saved object:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: {
            error: error.message || 'Unknown error occurred',
            message: error.message || 'Failed to delete saved object',
          },
        });
      }
    }
  );
}
