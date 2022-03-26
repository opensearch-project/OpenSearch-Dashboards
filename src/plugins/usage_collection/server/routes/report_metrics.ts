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

// import { schema } from '@osd/config-schema';
import { IRouter, ISavedObjectsRepository } from 'opensearch-dashboards/server';
// import { storeReport, reportSchema } from '../report';

export function registerUiMetricRoute(
  router: IRouter,
  getSavedObjects: () => ISavedObjectsRepository | undefined
) {
  /*
  router.post(
    {
      path: '/api/ui_metric/report',
      validate: {
        body: schema.object({
          report: reportSchema,
        }),
      },
    },
    async (context, req, res) => {
      const { report } = req.body;
      try {
        const internalRepository = getSavedObjects();
        if (!internalRepository) {
          throw Error(`The saved objects client hasn't been initialised yet`);
        }
        await storeReport(internalRepository, report);
        return res.ok({ body: { status: 'ok' } });
      } catch (error) {
        return res.ok({ body: { status: 'fail' } });
      }
    }
  );*/
}
