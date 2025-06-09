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

import { DiscoverSetup, DiscoverStart } from '.';
import { coreMock } from '../../../core/public/mocks';
import { chartPluginMock } from '../../charts/public/mocks';
import { dataPluginMock } from '../../data/public/mocks';
import { embeddablePluginMock } from '../../embeddable/public/mocks';
import { inspectorPluginMock } from '../../inspector/public/mocks';
import { navigationPluginMock } from '../../navigation/public/mocks';
import { opensearchDashboardsLegacyPluginMock } from '../../opensearch_dashboards_legacy/public/mocks';
import { uiActionsPluginMock } from '../../ui_actions/public/mocks';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { visualizationsPluginMock } from '../../visualizations/public/mocks';
import { buildServices, DiscoverServices } from './build_services';

export type Setup = jest.Mocked<DiscoverSetup>;
export type Start = jest.Mocked<DiscoverStart>;

const createSetupContract = (): Setup => {
  const setupContract: Setup = {
    docViews: {
      addDocView: jest.fn(),
    },
    docViewsLinks: {
      addDocViewLink: jest.fn(),
    },
  };
  return setupContract;
};

const createStartContract = (): Start => {
  const startContract: Start = {
    savedSearchLoader: {} as any,
    urlGenerator: {
      createUrl: jest.fn(),
    } as any,
  };
  return startContract;
};

const createDiscoverServicesMock = (): DiscoverServices =>
  buildServices(
    coreMock.createStart(),
    {
      data: dataPluginMock.createStartContract(),
      charts: chartPluginMock.createStartContract(),
      embeddable: embeddablePluginMock.createStartContract(),
      inspector: inspectorPluginMock.createStartContract(),
      navigation: navigationPluginMock.createStartContract(),
      uiActions: uiActionsPluginMock.createStartContract(),
      urlForwarding: urlForwardingPluginMock.createStartContract(),
      visualizations: visualizationsPluginMock.createStartContract(),
      opensearchDashboardsLegacy: opensearchDashboardsLegacyPluginMock.createStartContract(),
    },
    coreMock.createPluginInitializerContext()
  );

export const discoverPluginMock = {
  createDiscoverServicesMock,
  createSetupContract,
  createStartContract,
};
