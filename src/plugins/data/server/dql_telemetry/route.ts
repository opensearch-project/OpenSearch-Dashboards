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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { StartServicesAccessor, IRouter, Logger } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';

export function registerDqlTelemetryRoute(
  router: IRouter,
  getStartServices: StartServicesAccessor,
  logger: Logger
) {
  router.post(
    {
      path: '/api/opensearch-dashboards/dql_opt_in_stats',
      validate: {
        body: schema.object({
          opt_in: schema.boolean(),
        }),
      },
    },
    async (context, request, response) => {
      const [{ savedObjects }] = await getStartServices();
      const internalRepository = savedObjects.createScopedRepository(request);

      const {
        body: { opt_in: optIn },
      } = request;

      const counterName = optIn ? 'optInCount' : 'optOutCount';

      try {
        await internalRepository.incrementCounter('dql-telemetry', 'dql-telemetry', counterName);
      } catch (error) {
        logger.warn(`Unable to increment counter: ${error}`);
        return response.customError({
          statusCode: error.status,
          body: {
            message: 'Something went wrong',
            attributes: {
              success: false,
            },
          },
        });
      }

      return response.ok({ body: { success: true } });
    }
  );
}
