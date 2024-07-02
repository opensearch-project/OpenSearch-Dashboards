/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { applicationServiceMock, chromeServiceMock, coreMock } from '../../../core/public/mocks';
import { HomeOpenSearchDashboardsServices } from './application/opensearch_dashboards_services';
import { injectedMetadataServiceMock } from '../../../core/public/mocks';

export const createHomeServicesMock = () => {
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
