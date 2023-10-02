/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { EventEmitter } from 'events';
import { Observable } from 'rxjs';

import { useDashboardAppAndGlobalState } from './use_dashboard_app_state';
import { DashboardServices } from '../../../types';
import { SavedObjectDashboard } from '../../../saved_dashboards';
import { dashboardAppStateStub } from '../stubs';
import { createDashboardServicesMock } from '../mocks';
import { Dashboard } from '../../../dashboard';
import { convertToSerializedDashboard } from '../../../saved_dashboards/_saved_dashboard';

jest.mock('../create_dashboard_app_state');
jest.mock('../create_dashboard_container.tsx');
jest.mock('../../../../../data/public');

describe('useDashboardAppAndGlobalState', () => {
  const { createDashboardGlobalAndAppState } = jest.requireMock('../create_dashboard_app_state');
  const { connectToQueryState } = jest.requireMock('../../../../../data/public');
  const stopStateSyncMock = jest.fn();
  const stopSyncingQueryServiceStateWithUrlMock = jest.fn();
  const stateContainerGetStateMock = jest.fn(() => dashboardAppStateStub);
  const stopSyncingAppFiltersMock = jest.fn();
  const stateContainer = {
    getState: stateContainerGetStateMock,
    state$: new Observable(),
    transitions: {
      set: jest.fn(),
    },
  };

  createDashboardGlobalAndAppState.mockImplementation(() => ({
    stateContainer,
    stopStateSync: stopStateSyncMock,
    stopSyncingQueryServiceStateWithUrl: stopSyncingQueryServiceStateWithUrlMock,
  }));
  connectToQueryState.mockImplementation(() => stopSyncingAppFiltersMock);

  const eventEmitter = new EventEmitter();
  const savedDashboardInstance = ({
    ...dashboardAppStateStub,
    ...{
      getQuery: () => dashboardAppStateStub.query,
      getFilters: () => dashboardAppStateStub.filters,
      optionsJSON: JSON.stringify(dashboardAppStateStub.options),
    },
  } as unknown) as SavedObjectDashboard;
  const dashboard = new Dashboard(convertToSerializedDashboard(savedDashboardInstance));

  let mockServices: jest.Mocked<DashboardServices>;

  beforeEach(() => {
    mockServices = createDashboardServicesMock();

    stopStateSyncMock.mockClear();
    stopSyncingAppFiltersMock.mockClear();
    stopSyncingQueryServiceStateWithUrlMock.mockClear();
  });

  it('should not create appState if dashboard instance and dashboard is not ready', () => {
    const { result } = renderHook(() =>
      useDashboardAppAndGlobalState({ services: mockServices, eventEmitter })
    );

    expect(result.current).toEqual({
      appState: undefined,
      currentContainer: undefined,
      indexPatterns: [],
    });
  });

  it('should create appState and connect it to query search params', () => {
    const { result } = renderHook(() =>
      useDashboardAppAndGlobalState({
        services: mockServices,
        eventEmitter,
        savedDashboardInstance,
        dashboard,
      })
    );

    expect(createDashboardGlobalAndAppState).toHaveBeenCalledWith({
      services: mockServices,
      stateDefaults: dashboardAppStateStub,
      osdUrlStateStorage: mockServices.osdUrlStateStorage,
      savedDashboardInstance,
    });
    expect(mockServices.data.query.filterManager.setAppFilters).toHaveBeenCalledWith(
      dashboardAppStateStub.filters
    );
    expect(connectToQueryState).toHaveBeenCalledWith(mockServices.data.query, expect.any(Object), {
      filters: 'appState',
      query: true,
    });
    expect(result.current).toEqual({
      appState: stateContainer,
      currentContainer: undefined,
      indexPatterns: [],
    });
  });

  it('should stop state and app filters syncing with query on destroy', () => {
    const { unmount } = renderHook(() =>
      useDashboardAppAndGlobalState({
        services: mockServices,
        eventEmitter,
        savedDashboardInstance,
        dashboard,
      })
    );

    unmount();

    expect(stopStateSyncMock).toBeCalledTimes(1);
    expect(stopSyncingAppFiltersMock).toBeCalledTimes(1);
    expect(stopSyncingQueryServiceStateWithUrlMock).toBeCalledTimes(1);
  });
});
