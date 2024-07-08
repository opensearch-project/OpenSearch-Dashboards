/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { applicationServiceMock, chromeServiceMock, coreMock } from '../../../../core/public/mocks';
import { HomeOpenSearchDashboardsServices } from '../application/opensearch_dashboards_services';
import { injectedMetadataServiceMock } from '../../../../core/public/mocks';
import { featureCatalogueRegistryMock } from '../services/feature_catalogue/feature_catalogue_registry.mock';
import { environmentServiceMock } from '../services/environment/environment.mock';
import { tutorialServiceMock } from '../services/tutorials/tutorial_service.mock';
import { sectionTypeServiceMock } from '../services/section_type/section_type.mock';
import { configSchema } from '../../config';

const createSetupContract = () => ({
  featureCatalogue: featureCatalogueRegistryMock.createSetup(),
  environment: environmentServiceMock.createSetup(),
  tutorials: tutorialServiceMock.createSetup(),
  sectionTypes: sectionTypeServiceMock.createSetup(),
});

export const createStartContract = () => {
  const coreStartMock = coreMock.createStart();
  const chromeMock = chromeServiceMock.createStartContract();
  const applicationMock = applicationServiceMock.createStartContract();
  const toastNotifications = coreStartMock.notifications.toasts;
  const injectedMetadataMock = injectedMetadataServiceMock.createStartContract();
  injectedMetadataMock.getBranding.mockReturnValue({});
  const addBasePathMock = jest.fn((path: string) => (path ? path : 'path'));
  const opensearchDashboardsVersion = '3.0.0';

  return ({
    ...coreStartMock,
    chrome: chromeMock,
    application: applicationMock,
    injectedMetadata: injectedMetadataMock,
    addBasePath: addBasePathMock,
    getBasePath: jest.fn(),
    toastNotifications,
    opensearchDashboardsVersion,
    trackUiMetric: jest.fn(),
    savedObjectsClient: {
      find: async () => {
        return {
          total: 0,
        };
      },
    },
  } as unknown) as jest.Mocked<HomeOpenSearchDashboardsServices>;
};

export const homePluginMock = {
  createSetupContract,
  createStartContract,
};
