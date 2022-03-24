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

import {
  CoreStart,
  Plugin,
  CoreSetup,
  AppMountParameters,
  AppNavLinkStatus,
} from '../../../src/core/public';
import { DeveloperExamplesSetup } from '../../developer_examples/public';
import { getServices } from './services';

interface SetupDeps {
  developerExamples: DeveloperExamplesSetup;
}

export class RoutingExamplePlugin implements Plugin<{}, {}, SetupDeps, {}> {
  public setup(core: CoreSetup, { developerExamples }: SetupDeps) {
    core.application.register({
      id: 'routingExample',
      title: 'Routing',
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const [coreStart] = await core.getStartServices();
        const startServices = getServices(coreStart);
        const { renderApp } = await import('./app');
        return renderApp(startServices, params.element);
      },
    });

    developerExamples.register({
      appId: 'routingExample',
      title: 'Routing',
      description: `Examples show how to use core routing and fetch services to register and query your own custom routes.`,
      links: [
        {
          label: 'IRouter',
          href:
            'https://github.com/opensearch-project/OpenSearch-Dashboards/blob/master/docs/development/core/server/opensearch-dashboards-plugin-core-server.irouter.md',
          iconType: 'logoGithub',
          target: '_blank',
          size: 's',
        },
        {
          label: 'HttpHandler (core.http.fetch)',
          href:
            'https://github.com/opensearch-project/OpenSearch-Dashboards/blob/master/docs/development/core/public/opensearch-dashboards-plugin-core-public.httphandler.md',
          iconType: 'logoGithub',
          target: '_blank',
          size: 's',
        },
      ],
    });
    return {};
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
