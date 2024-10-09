/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter, ILegacyClusterClient } from '../../../../core/server';
import { registerDslRoute } from './dsl';
import {
  registerDataConnectionsRoute,
  registerNonMdsDataConnectionsRoute,
} from './data_connections_router';
import { registerDatasourcesRoute } from './datasources_router';
import { registerPplRoute } from './ppl';
import { DSLFacet } from '../services/facets/dsl_facet';
import { PPLFacet } from '../services/facets/ppl_facet';

export function defineRoutes(router: IRouter) {
  router.get(
    {
      path: '/api/data_source_management/example',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          time: new Date().toISOString(),
        },
      });
    }
  );
}

export function setupRoutes({
  router,
  client,
  dataSourceEnabled,
}: {
  router: IRouter;
  client: ILegacyClusterClient;
  dataSourceEnabled: boolean;
}) {
  registerPplRoute({ router, facet: new PPLFacet(client) });
  registerDslRoute({ router, facet: new DSLFacet(client) }, dataSourceEnabled);

  // notebooks routes
  // const queryService = new QueryService(client);
  // registerSqlRoute(router, queryService);

  if (!dataSourceEnabled) {
    registerNonMdsDataConnectionsRoute(router);
  }
  registerDataConnectionsRoute(router, dataSourceEnabled);
  registerDatasourcesRoute(router, dataSourceEnabled);
}
