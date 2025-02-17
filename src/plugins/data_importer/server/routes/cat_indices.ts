/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from 'src/core/server';
import { schema, TypeOf } from '@osd/config-schema';
import _ from 'lodash';
import { configSchema } from '../../config';
import { decideClient } from '../utils/util';

export function catIndicesRoute(
  router: IRouter,
  config: TypeOf<typeof configSchema>,
  dataSourceEnabled: boolean
) {
  router.post(
    {
      path: '/api/data_importer/_cat_indices',
      validate: {
        query: schema.object({
          dataSource: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const client = await decideClient(dataSourceEnabled, context, request.query.dataSource);
      if (!!!client) {
        return response.notFound({
          body: 'Data source is not enabled or does not exist',
        });
      }

      try {
        const indices = await client.cat.indices({
          format: 'json',
        });
        return response.ok({
          body: {
            indices: indices.body.map((index: { index?: string }) => index.index || 'unknown'),
          },
        });
      } catch (e) {
        return response.internalError({
          body: `Error when listing indices: ${e}`,
        });
      }
    }
  );
}
