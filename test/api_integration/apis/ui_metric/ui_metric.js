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

import expect from '@osd/expect';
import { ReportManager, METRIC_TYPE } from '@osd/analytics';

export default function ({ getService }) {
  const supertest = getService('supertest');
  const opensearch = getService('legacyOpenSearch');

  const createStatsMetric = (eventName) => ({
    eventName,
    appName: 'myApp',
    type: METRIC_TYPE.CLICK,
    count: 1,
  });

  const createUserAgentMetric = (appName) => ({
    appName,
    type: METRIC_TYPE.USER_AGENT,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.87 Safari/537.36',
  });

  describe('ui_metric API', () => {
    it('increments the count field in the document defined by the {app}/{action_type} path', async () => {
      const reportManager = new ReportManager();
      const uiStatsMetric = createStatsMetric('myEvent');
      const { report } = reportManager.assignReports([uiStatsMetric]);
      await supertest
        .post('/api/ui_metric/report')
        .set('osd-xsrf', 'opensearch-dashboards')
        .set('content-type', 'application/json')
        .send({ report })
        .expect(200);

      const response = await opensearch.search({
        index: '.kibana',
        q: 'type:ui-metric',
      });
      const ids = response.hits.hits.map(({ _id }) => _id);
      expect(ids.includes('ui-metric:myApp:myEvent')).to.eql(true);
    });

    it('supports multiple events', async () => {
      const reportManager = new ReportManager();
      const userAgentMetric = createUserAgentMetric('opensearchDashboards');
      const uiStatsMetric1 = createStatsMetric('myEvent');
      const hrTime = process.hrtime();
      const nano = hrTime[0] * 1000000000 + hrTime[1];
      const uniqueEventName = `myEvent${nano}`;
      const uiStatsMetric2 = createStatsMetric(uniqueEventName);
      const { report } = reportManager.assignReports([
        userAgentMetric,
        uiStatsMetric1,
        uiStatsMetric2,
      ]);
      await supertest
        .post('/api/ui_metric/report')
        .set('osd-xsrf', 'opensearch-dashboards')
        .set('content-type', 'application/json')
        .send({ report })
        .expect(200);

      const response = await opensearch.search({
        index: '.kibana',
        q: 'type:ui-metric',
      });
      const ids = response.hits.hits.map(({ _id }) => _id);
      expect(ids.includes('ui-metric:myApp:myEvent')).to.eql(true);
      expect(ids.includes(`ui-metric:myApp:${uniqueEventName}`)).to.eql(true);
      expect(
        ids.includes(`ui-metric:opensearch-dashboards-user_agent:${userAgentMetric.userAgent}`)
      ).to.eql(true);
    });
  });
}
