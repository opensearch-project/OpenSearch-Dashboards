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
import { scopedHistoryMock } from '../../../../../core/public/mocks';
import { ScopedHistory } from '../../../../../core/public';

export const createDashboardServicesMock = () => {
  const coreStartMock = coreMock.createStart();
  const dataStartMock = dataPluginMock.createStartContract();
  const toastNotifications = coreStartMock.notifications.toasts;
  const dashboard = dashboardPluginMock.createStartContract();
  const usageCollection = usageCollectionPluginMock.createSetupContract();
  const embeddable = embeddablePluginMock.createStartContract();
  const opensearchDashboardsVersion = '3.0.0';
  const scopedHistory = (scopedHistoryMock.create() as unknown) as ScopedHistory;

  return ({
    ...coreStartMock,
    data: dataStartMock,
    toastNotifications,
    history: {
      replace: jest.fn(),
      location: { pathname: '' },
    },
    scopedHistory,
    dashboardConfig: {
      getHideWriteControls: jest.fn(),
    },
    dashboard,
    opensearchDashboardsVersion,
    usageCollection,
    embeddable,
    savedObjectsClient: {
      find: jest.fn(),
      get: jest.fn().mockResolvedValue({
        attributes: { title: 'flint_ds1_db1_index1' },
        references: [{ type: 'data-source', id: 'test-mds' }],
      }),
    },
    savedObjectsPublic: {
      settings: {
        getPerPage: () => 10,
        getListingLimit: jest.fn(),
      },
    },
  } as unknown) as jest.Mocked<DashboardServices>;
};
