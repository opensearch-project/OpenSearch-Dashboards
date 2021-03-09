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

import { i18n } from 'src/plugins/home/server/tutorials/opensearch_metrics/node_modules/@osd/i18n';

export const createTrycloudOption1 = () => ({
  title: i18n.translate('home.tutorials.common.premCloudInstructions.option1.title', {
    defaultMessage: 'Option 1: Try in Elastic Cloud',
  }),
  textPre: i18n.translate('home.tutorials.common.premCloudInstructions.option1.textPre', {
    defaultMessage:
      'Go to [Elastic Cloud]({link}). Register if you \
do not already have an account. Free 14-day trial available.\n\n\
Log into the Elastic Cloud console\n\n\
To create a cluster, in Elastic Cloud console:\n\
 1. Select **Create Deployment** and specify the **Deployment Name**\n\
 2. Modify the other deployment options as needed (or not, the defaults are great to get started)\n\
 3. Click **Create Deployment**\n\
 4. Wait until deployment creation completes\n\
 5. Go to the new Cloud OpenSearch Dashboards instance and follow the OpenSearch Dashboards Home instructions',
    values: {
      link: 'https://www.elastic.co/cloud/as-a-service/signup?blade=kib',
    },
  }),
});

export const createTrycloudOption2 = () => ({
  title: i18n.translate('home.tutorials.common.premCloudInstructions.option2.title', {
    defaultMessage: 'Option 2: Connect local OpenSearch Dashboards to a Cloud instance',
  }),
  textPre: i18n.translate('home.tutorials.common.premCloudInstructions.option2.textPre', {
    defaultMessage:
      'If you are running this OpenSearch Dashboards instance against a hosted OpenSearch instance, \
proceed with manual setup.\n\n\
Save the **OpenSearch** endpoint as {urlTemplate} and the cluster **Password** as {passwordTemplate} for your records',
    values: {
      urlTemplate: '`<opensearch_url>`',
      passwordTemplate: '`<password>`',
    },
  }),
});
