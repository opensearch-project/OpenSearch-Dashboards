/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from '../../../../core/server';
import { registerQueryAssistRoutes } from './query_assist';
import { registerDataSourceConnectionsRoutes } from './data_source_connection';

/**
 * Defines routes for various search strategies and registers additional routes.
 *
 * @experimental This function is experimental and might change in future releases.
 *
 * @param router - The router instance.
 * @param client - The client instance.
 */
export function defineRoutes(router: IRouter, client: any) {
  registerDataSourceConnectionsRoutes(router, client);
  registerQueryAssistRoutes(router);
}
