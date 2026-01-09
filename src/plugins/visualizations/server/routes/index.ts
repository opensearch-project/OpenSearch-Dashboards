/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { IRouter } from '../../../../core/server';
import { registerVisualizationSummaryRoute } from './visualization_summary';

export function setupRoutes(router: IRouter) {
  registerVisualizationSummaryRoute(router);
}
