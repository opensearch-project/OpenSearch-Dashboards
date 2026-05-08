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

import { coreMock } from 'opensearch-dashboards/public/mocks';
import { ExplorePluginSetup, ExplorePluginStart } from '../../../types';
import { chartPluginMock } from '../../../../../charts/public/mocks';
import { dataPluginMock } from '../../../../../data/public/mocks';
import { embeddablePluginMock } from '../../../../../embeddable/public/mocks';
import { inspectorPluginMock } from '../../../../../inspector/public/mocks';
import { navigationPluginMock } from '../../../../../navigation/public/mocks';
import { opensearchDashboardsLegacyPluginMock } from '../../../../../opensearch_dashboards_legacy/public/mocks';
import { uiActionsPluginMock } from '../../../../../ui_actions/public/mocks';
import { urlForwardingPluginMock } from '../../../../../url_forwarding/public/mocks';
import { visualizationsPluginMock } from '../../../../../visualizations/public/mocks';
import { ExploreServices } from '../../../types';
import { buildServices } from '../../../build_services';
import { VisualizationRegistry } from '../../../components/visualizations/visualization_registry';
import { expressionsPluginMock } from '../../../../../expressions/public/mocks';
import { dashboardPluginMock } from '../../../../../dashboard/public/mocks';

export type Setup = jest.Mocked<ExplorePluginSetup>;
export type Start = jest.Mocked<ExplorePluginStart>;

const createSetupContract = (): Setup => {
  // @ts-expect-error TS2322 TODO(ts-error): fixme
  const setupContract: Setup = {
    visualizationRegistry: (jest.fn() as unknown) as VisualizationRegistry,
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
  // @ts-expect-error TS2322 TODO(ts-error): fixme
  const startContract: Start = {
    savedExploreLoader: {} as any,
    savedSearchLoader: {} as any,
    visualizationRegistry: {} as VisualizationRegistry,
    urlGenerator: {
      createUrl: jest.fn(),
    } as any,
  };
  return startContract;
};

const createExploreServicesMock = (): ExploreServices =>
  // @ts-expect-error TS2554 TODO(ts-error): fixme
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
      expressions: expressionsPluginMock.createStartContract(),
      dashboard: dashboardPluginMock.createStartContract(),
    },
    coreMock.createPluginInitializerContext(),
    {} as any, // Mock tabRegistry
    {} as any // Mock visualizationRegistry
  );

export const discoverPluginMock = {
  createExploreServicesMock,
  createSetupContract,
  createStartContract,
};
