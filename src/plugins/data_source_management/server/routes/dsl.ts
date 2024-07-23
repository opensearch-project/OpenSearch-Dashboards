/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console*/
import { schema } from '@osd/config-schema';
import { RequestParams } from '@elastic/elasticsearch';
import { IRouter } from '../../../../core/server';
import { DSLFacet } from '../services/facets/dsl_facet';
import {
  DSL_BASE,
  DSL_SEARCH,
  DSL_CAT,
  DSL_MAPPING,
  DSL_SETTINGS,
} from '../../framework/utils/shared';

export function registerDslRoute(
  { router }: { router: IRouter; facet: DSLFacet },
  dataSourceEnabled: boolean
) {
  router.post(
    {
      path: `${DSL_BASE}${DSL_SEARCH}`,
      validate: { body: schema.any() },
    },
    async (context, request, response) => {
      const { index, size, ...rest } = request.body;
      const params: RequestParams.Search = {
        index,
        size,
        body: rest,
      };
      try {
        const resp = await context.core.opensearch.legacy.client.callAsCurrentUser(
          'search',
          params
        );
        return response.ok({
          body: resp,
        });
      } catch (error) {
        if (error.statusCode !== 404) console.error(error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.get(
    {
      path: `${DSL_BASE}${DSL_CAT}`,
      validate: {
        query: schema.object({
          format: schema.string(),
          index: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const resp = await context.core.opensearch.legacy.client.callAsCurrentUser(
          'cat.indices',
          request.query
        );
        return response.ok({
          body: resp,
        });
      } catch (error) {
        if (error.statusCode !== 404) console.error(error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.get(
    {
      path: `${DSL_BASE}${DSL_MAPPING}`,
      validate: { query: schema.any() },
    },
    async (context, request, response) => {
      try {
        const resp = await context.core.opensearch.legacy.client.callAsCurrentUser(
          'indices.getMapping',
          { index: request.query.index }
        );
        return response.ok({
          body: resp,
        });
      } catch (error) {
        if (error.statusCode !== 404) console.error(error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.get(
    {
      path: `${DSL_BASE}${DSL_SETTINGS}`,
      validate: { query: schema.any() },
    },
    async (context, request, response) => {
      try {
        const resp = await context.core.opensearch.legacy.client.callAsCurrentUser(
          'indices.getSettings',
          { index: request.query.index }
        );
        return response.ok({
          body: resp,
        });
      } catch (error) {
        if (error.statusCode !== 404) console.error(error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  // New routes for mds enabled
  router.get(
    {
      path: `${DSL_BASE}${DSL_CAT}/dataSourceMDSId={dataSourceMDSId?}`,
      validate: {
        query: schema.object({
          format: schema.string(),
          index: schema.maybe(schema.string()),
        }),
        params: schema.object({
          dataSourceMDSId: schema.maybe(schema.string({ defaultValue: '' })),
        }),
      },
    },
    async (context, request, response) => {
      const dataSourceMDSId = request.params.dataSourceMDSId;
      try {
        let resp;
        if (dataSourceEnabled && dataSourceMDSId) {
          const client = await context.dataSource.opensearch.legacy.getClient(dataSourceMDSId);
          resp = await client.callAPI('cat.indices', request.query);
        } else {
          resp = await context.core.opensearch.legacy.client.callAsCurrentUser(
            'cat.indices',
            request.query
          );
        }
        return response.ok({
          body: resp,
        });
      } catch (error) {
        if (error.statusCode !== 404) console.error(error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.get(
    {
      path: `${DSL_BASE}${DSL_MAPPING}/dataSourceMDSId={dataSourceMDSId?}`,
      validate: {
        query: schema.any(),
        params: schema.object({
          dataSourceMDSId: schema.maybe(schema.string({ defaultValue: '' })),
        }),
      },
    },
    async (context, request, response) => {
      const dataSourceMDSId = request.params.dataSourceMDSId;
      try {
        let resp;
        if (dataSourceEnabled && dataSourceMDSId) {
          const client = await context.dataSource.opensearch.legacy.getClient(dataSourceMDSId);
          resp = await client.callAPI('indices.getMapping', { index: request.query.index });
        } else {
          resp = await context.core.opensearch.legacy.client.callAsCurrentUser(
            'indices.getMapping',
            { index: request.query.index }
          );
        }
        return response.ok({
          body: resp,
        });
      } catch (error) {
        if (error.statusCode !== 404) console.error(error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.get(
    {
      path: `${DSL_BASE}${DSL_SETTINGS}/dataSourceMDSId={dataSourceMDSId?}`,
      validate: {
        query: schema.any(),
        params: schema.object({
          dataSourceMDSId: schema.maybe(schema.string({ defaultValue: '' })),
        }),
      },
    },
    async (context, request, response) => {
      const dataSourceMDSId = request.params.dataSourceMDSId;
      try {
        let resp;
        if (dataSourceEnabled && dataSourceMDSId) {
          const client = await context.dataSource.opensearch.legacy.getClient(dataSourceMDSId);
          resp = await client.callAPI('indices.getSettings', { index: request.query.index });
        } else {
          resp = await context.core.opensearch.legacy.client.callAsCurrentUser(
            'indices.getSettings',
            { index: request.query.index }
          );
        }
        return response.ok({
          body: resp,
        });
      } catch (error) {
        if (error.statusCode !== 404) console.error(error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
