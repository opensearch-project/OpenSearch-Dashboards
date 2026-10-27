/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
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
    subscribe: jest.fn(() => jest.fn()),
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
  const savedDashboardInstance = {
    ...dashboardAppStateStub,
    ...{
      getQuery: () => dashboardAppStateStub.query,
      getFilters: () => dashboardAppStateStub.filters,
      optionsJSON: JSON.stringify(dashboardAppStateStub.options),
    },
  } as unknown as SavedObjectDashboard;
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
    expect(mockServices.data.query.queryString.setQuery).toHaveBeenCalledWith(
      dashboardAppStateStub.query,
      false,
      false
    );
    expect(connectToQueryState).toHaveBeenCalledWith(mockServices.data.query, expect.any(Object), {
      filters: 'appState',
      query: true,
    });
    const queryStateAdapter = (connectToQueryState as jest.Mock).mock.calls[0][1];
    queryStateAdapter.set({ filters: [], query: undefined });
    expect(stateContainer.transitions.set).toHaveBeenCalledWith('query', {
      language: 'kuery',
      query: '',
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

    expect(stopStateSyncMock).toHaveBeenCalledTimes(1);
    expect(stopSyncingAppFiltersMock).toHaveBeenCalledTimes(1);
    expect(stopSyncingQueryServiceStateWithUrlMock).toHaveBeenCalledTimes(1);
  });

  describe('dashboard container lifecycle', () => {
    const {
      createDashboardContainer,
      handleDashboardContainerInputs,
      handleDashboardContainerOutputs,
    } = jest.requireMock('../create_dashboard_container.tsx');

    const createContainerMock = () => ({ destroy: jest.fn() });

    beforeEach(() => {
      handleDashboardContainerInputs.mockReset().mockReturnValue(jest.fn());
      handleDashboardContainerOutputs.mockReset().mockReturnValue(jest.fn());
    });

    afterEach(() => {
      createDashboardContainer.mockReset();
    });

    const renderAppState = (props = { savedDashboardInstance, dashboard }) =>
      renderHook(
        (current: { savedDashboardInstance: SavedObjectDashboard; dashboard: Dashboard }) =>
          useDashboardAppAndGlobalState({ services: mockServices, eventEmitter, ...current }),
        { initialProps: props }
      );

    it('destroys the container when the dashboard is left', async () => {
      const container = createContainerMock();
      createDashboardContainer.mockResolvedValue(container);
      const { result, unmount } = renderAppState();
      await waitFor(() => expect(result.current.currentContainer).toBe(container));

      unmount();

      expect(container.destroy).toHaveBeenCalledTimes(1);
    });

    it('destroys a container that finishes loading after the dashboard was left', async () => {
      const container = createContainerMock();
      let resolveContainer: (value: unknown) => void = () => {};
      createDashboardContainer.mockReturnValue(
        new Promise((resolve) => {
          resolveContainer = resolve;
        })
      );
      const { unmount } = renderAppState();

      unmount();
      await act(async () => resolveContainer(container));

      expect(container.destroy).toHaveBeenCalledTimes(1);
      expect(handleDashboardContainerInputs).not.toHaveBeenCalled();
    });

    it('destroys the previous container when switching to another dashboard', async () => {
      const first = createContainerMock();
      const second = createContainerMock();
      createDashboardContainer.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
      const { result, rerender } = renderAppState();
      await waitFor(() => expect(result.current.currentContainer).toBe(first));

      const otherDashboard = new Dashboard(convertToSerializedDashboard(savedDashboardInstance));
      rerender({ savedDashboardInstance, dashboard: otherDashboard });
      await waitFor(() => expect(result.current.currentContainer).toBe(second));

      expect(first.destroy).toHaveBeenCalledTimes(1);
      expect(second.destroy).not.toHaveBeenCalled();
    });

    it('stops syncing with the container before destroying it', async () => {
      const calls: string[] = [];
      handleDashboardContainerInputs.mockReturnValue(() => calls.push('stop inputs'));
      handleDashboardContainerOutputs.mockReturnValue(() => calls.push('stop outputs'));
      const container = { destroy: jest.fn(() => calls.push('destroy')) };
      createDashboardContainer.mockResolvedValue(container);
      const { result, unmount } = renderAppState();
      await waitFor(() => expect(result.current.currentContainer).toBe(container));

      unmount();

      expect(calls).toEqual(['stop inputs', 'stop outputs', 'destroy']);
    });

    it('clears the current container while the next dashboard loads', async () => {
      const first = createContainerMock();
      createDashboardContainer
        .mockResolvedValueOnce(first)
        .mockReturnValueOnce(new Promise(() => {})); // the next one never finishes loading
      const { result, rerender } = renderAppState();
      await waitFor(() => expect(result.current.currentContainer).toBe(first));

      const otherDashboard = new Dashboard(convertToSerializedDashboard(savedDashboardInstance));
      rerender({ savedDashboardInstance, dashboard: otherDashboard });

      expect(first.destroy).toHaveBeenCalledTimes(1);
      expect(result.current.currentContainer).toBeUndefined();
    });

    it('does not fail when the dashboard is left and no container is created', async () => {
      let resolveContainer: (value: unknown) => void = () => {};
      createDashboardContainer.mockReturnValue(
        new Promise((resolve) => {
          resolveContainer = resolve;
        })
      );
      const { unmount } = renderAppState();

      unmount();
      await act(async () => resolveContainer(undefined));

      expect(handleDashboardContainerInputs).not.toHaveBeenCalled();
    });
  });
});
