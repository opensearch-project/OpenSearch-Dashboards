/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../../../core/public/mocks';
import { dataPluginMock } from '../../../../data/public/mocks';
import { dashboardPluginMock } from '../../../../dashboard/public/mocks';
import { usageCollectionPluginMock } from '../../../../usage_collection/public/mocks';
import { embeddablePluginMock } from '../../../../embeddable/public/mocks';
import { DashboardServices } from '../../types';

export const createDashboardServicesMock = () => {
  const coreStartMock = coreMock.createStart();
  const dataStartMock = dataPluginMock.createStartContract();
  const toastNotifications = coreStartMock.notifications.toasts;
  const dashboard = dashboardPluginMock.createStartContract();
  const usageCollection = usageCollectionPluginMock.createSetupContract();
  const embeddable = embeddablePluginMock.createStartContract();
  const opensearchDashboardsVersion = '3.0.0';

  return ({
    ...coreStartMock,
    data: dataStartMock,
    toastNotifications,
    history: {
      replace: jest.fn(),
      location: { pathname: '' },
    },
    dashboardConfig: {
      getHideWriteControls: jest.fn(),
    },
    dashboard,
    opensearchDashboardsVersion,
    usageCollection,
    embeddable,
    savedObjectsClient: {
      find: jest.fn(),
    },
    savedObjectsPublic: {
      settings: {
        getPerPage: () => 10,
        getListingLimit: jest.fn(),
      },
    },
  } as unknown) as jest.Mocked<DashboardServices>;
};
