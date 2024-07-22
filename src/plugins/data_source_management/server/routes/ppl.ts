/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, IOpenSearchDashboardsResponse, ResponseError } from './../../../../core/server';
import { PPLFacet } from '../services/facets/ppl_facet';
import { PPL_BASE, PPL_SEARCH } from '../../framework/utils/shared';

export function registerPplRoute({ router, facet }: { router: IRouter; facet: PPLFacet }) {
  router.post(
    {
      path: `${PPL_BASE}${PPL_SEARCH}`,
      validate: {
        body: schema.object({
          query: schema.string(),
          format: schema.string(),
        }),
      },
    },
    async (context, req, res): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      const queryRes: any = await facet.describeQuery(req);
      if (queryRes.success) {
        const result: any = {
          body: {
            ...queryRes.data,
          },
        };
        return res.ok(result);
      }
      return res.custom({
        statusCode: queryRes.data.statusCode || queryRes.data.status || 500,
        body: queryRes.data.body || queryRes.data.message || '',
      });
    }
  );
}
