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

import { IRouter, OpenSearchDashboardsRequest } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { getVisData, GetVisDataOptions } from '../lib/get_vis_data';
import { visPayloadSchema } from '../../common/vis_schema';
import { ValidationTelemetryServiceSetup } from '../index';
import { Framework } from '../plugin';

const escapeHatch = schema.object({}, { unknowns: 'allow' });

export const visDataRoutes = (
  router: IRouter,
  framework: Framework,
  { logFailedValidation }: ValidationTelemetryServiceSetup
) => {
  router.post(
    {
      path: '/api/metrics/vis/data',
      validate: {
        body: escapeHatch,
      },
    },
    async (requestContext, request, response) => {
      try {
        visPayloadSchema.validate(request.body);
      } catch (error) {
        logFailedValidation();
        const savedObjectId =
          (typeof request.body === 'object' && (request.body as any).savedObjectId) ||
          'unavailable';
        framework.logger.warn(
          `Request validation error: ${error.message} (saved object id: ${savedObjectId}). This most likely means your TSVB visualization contains outdated configuration. You can report this problem under https://github.com/opensearch-project/OpenSearch-Dashboards/issues/new?template=bug_template.md`
        );
      }

      try {
        const results = await getVisData(
          requestContext,
          request as OpenSearchDashboardsRequest<{}, {}, GetVisDataOptions>,
          framework
        );
        return response.ok({ body: results });
      } catch (error) {
        return response.internalError({
          body: error.message,
        });
      }
    }
  );
};
