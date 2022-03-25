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

import { Writer } from 'mustache';
import { getServices } from '../../opensearch_dashboards_services';

const TEMPLATE_TAGS = ['{', '}'];

// Can not use 'Mustache' since its a global object
const mustacheWriter = new Writer();
// do not html escape output
mustacheWriter.escapedValue = function escapedValue(token, context) {
  const value = context.lookup(token[1]);
  if (value != null) {
    return value;
  }
};

export function replaceTemplateStrings(text, params = {}) {
  const { tutorialService, opensearchDashboardsVersion, docLinks } = getServices();

  const variables = {
    // '{' and '}' can not be used in template since they are used as template tags.
    // Must use '{curlyOpen}'' and '{curlyClose}'
    curlyOpen: '{',
    curlyClose: '}',
    config: {
      ...tutorialService.getVariables(),
      docs: {
        base_url: docLinks.OPENSEARCH_WEBSITE_URL,
        beats: {
          filebeat: docLinks.links.noDocumentation.filebeat,
          metricbeat: docLinks.links.noDocumentation.metricbeat,
          heartbeat: docLinks.links.noDocumentation.heartbeat,
          functionbeat: docLinks.links.noDocumentation.functionbeat,
          winlogbeat: docLinks.links.noDocumentation.winlogbeat,
          auditbeat: docLinks.links.noDocumentation.auditbeat,
        },
        logstash: docLinks.links.noDocumentation.logstash,
        version: docLinks.DOC_LINK_VERSION,
      },
      opensearchDashboards: {
        version: opensearchDashboardsVersion,
      },
    },
    params: params,
  };
  mustacheWriter.parse(text, TEMPLATE_TAGS);
  return mustacheWriter.render(text, variables);
}
