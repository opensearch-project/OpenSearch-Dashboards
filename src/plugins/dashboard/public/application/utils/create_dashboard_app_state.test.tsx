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

import { IOsdUrlStateStorage } from 'src/plugins/opensearch_dashboards_utils/public';
import { createDashboardGlobalAndAppState, updateStateUrl } from './create_dashboard_app_state';
import { migrateAppState } from './migrate_app_state';
import { dashboardAppStateStub } from './stubs';
import { createDashboardServicesMock } from './mocks';
import { SavedObjectDashboard } from '../..';
import { syncQueryStateWithUrl } from 'src/plugins/data/public';
import { ViewMode } from 'src/plugins/embeddable/public';

const mockStartStateSync = jest.fn();
const mockStopStateSync = jest.fn();
const mockStopQueryStateSync = jest.fn();

jest.mock('../../../../opensearch_dashboards_utils/public', () => ({
  createStateContainer: jest.fn(() => 'stateContainer'),
  syncState: jest.fn(() => ({
    start: mockStartStateSync,
    stop: mockStopStateSync,
  })),
}));

jest.mock('../../../../data/public', () => ({
  syncQueryStateWithUrl: jest.fn(() => ({
    stop: mockStopQueryStateSync,
  })),
}));

jest.mock('./migrate_app_state', () => ({
  migrateAppState: jest.fn(() => 'migratedAppState'),
}));

const { createStateContainer, syncState } = jest.requireMock(
  '../../../../opensearch_dashboards_utils/public'
);

const osdUrlStateStorage = ({
  set: jest.fn(),
  get: jest.fn(() => ({ linked: false })),
  flush: jest.fn(),
} as unknown) as IOsdUrlStateStorage;

describe('createDashboardGlobalAndAppState', () => {
  const mockServices = createDashboardServicesMock();

  const savedDashboardInstance = {
    id: '',
    timeRestore: true,
    lastSavedTitle: 'title',
    searchSource: {},
    getQuery: () => {},
    getFilters: () => {},
  } as SavedObjectDashboard;

  const {
    stateContainer,
    stopStateSync,
    stopSyncingQueryServiceStateWithUrl,
  } = createDashboardGlobalAndAppState({
    stateDefaults: dashboardAppStateStub,
    osdUrlStateStorage,
    services: mockServices,
    savedDashboardInstance,
  });
  const transitions = createStateContainer.mock.calls[0][1];

  test('should initialize dashboard app state', () => {
    expect(osdUrlStateStorage.get).toHaveBeenCalledWith('_a');
    expect(migrateAppState).toHaveBeenCalledWith(
      {
        ...dashboardAppStateStub,
        linked: false,
      },
      mockServices.opensearchDashboardsVersion,
      mockServices.usageCollection
    );
    expect(osdUrlStateStorage.set).toHaveBeenCalledWith('_a', 'migratedAppState', {
      replace: true,
    });
    expect(createStateContainer).toHaveBeenCalled();
    expect(syncState).toHaveBeenCalled();
    expect(syncQueryStateWithUrl).toHaveBeenCalled();
    expect(mockStartStateSync).toHaveBeenCalled();
  });

  test('should return the stateContainer and stopStateSync and stopSyncingQueryServiceStateWithUrl', () => {
    expect(stateContainer).toBe('stateContainer');
    stopStateSync();
    stopSyncingQueryServiceStateWithUrl();
    expect(stopStateSync).toHaveBeenCalledTimes(1);
    expect(stopSyncingQueryServiceStateWithUrl).toHaveBeenCalledTimes(1);
  });

  describe('stateContainer transitions', () => {
    test('set', () => {
      const newQuery = { query: '', language: '' };
      expect(transitions.set(dashboardAppStateStub)('query', newQuery)).toEqual({
        ...dashboardAppStateStub,
        query: newQuery,
      });
    });

    test('setOption', () => {
      const newOptions = {
        hidePanelTitles: true,
      };
      expect(
        transitions.setOption(dashboardAppStateStub)('hidePanelTitles', newOptions.hidePanelTitles)
      ).toEqual({
        ...dashboardAppStateStub,
        options: {
          ...dashboardAppStateStub.options,
          ...newOptions,
        },
      });
    });

    test('setDashboard', () => {
      const newDashboard = {
        fullScreenMode: true,
        title: 'new title',
        description: 'New Dashboard Test Description',
        timeRestore: true,
        query: { query: '', language: 'kuery' },
        viewMode: ViewMode.VIEW,
      };
      expect(transitions.setDashboard(dashboardAppStateStub)(newDashboard)).toEqual({
        ...dashboardAppStateStub,
        ...newDashboard,
      });
    });
  });
});

describe('updateStateUrl', () => {
  const dashboardAppState = {
    ...dashboardAppStateStub,
    viewMode: ViewMode.VIEW,
  };
  updateStateUrl({ osdUrlStateStorage, state: dashboardAppState, replace: true });

  test('update URL to not contain panels', () => {
    const { panels, ...statesWithoutPanels } = dashboardAppState;
    expect(osdUrlStateStorage.set).toHaveBeenCalledWith('_a', statesWithoutPanels, {
      replace: true,
    });
    expect(osdUrlStateStorage.flush).toHaveBeenCalledWith({ replace: true });
  });
});
