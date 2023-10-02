/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { EventEmitter } from 'events';

import { useEditorUpdates } from './use_editor_updates';
import { DashboardServices, DashboardAppStateContainer } from '../../../types';
import { SavedObjectDashboard } from '../../../saved_dashboards';
import { dashboardAppStateStub } from '../stubs';
import { createDashboardServicesMock } from '../mocks';
import { Dashboard } from '../../../dashboard';
import { convertToSerializedDashboard } from '../../../saved_dashboards/_saved_dashboard';
import { setBreadcrumbsForExistingDashboard, setBreadcrumbsForNewDashboard } from '../breadcrumbs';
import { ViewMode } from '../../../../../embeddable/public';

describe('useEditorUpdates', () => {
  const eventEmitter = new EventEmitter();
  let mockServices: jest.Mocked<DashboardServices>;

  beforeEach(() => {
    mockServices = createDashboardServicesMock();
  });

  describe('should not create any subscriptions', () => {
    test('if app state container is not ready', () => {
      const { result } = renderHook(() =>
        useEditorUpdates({
          services: mockServices,
          eventEmitter,
        })
      );

      expect(result.current).toEqual({
        isEmbeddableRendered: false,
        currentAppState: undefined,
      });
    });

    test('if savedDashboardInstance is not ready', () => {
      const { result } = renderHook(() =>
        useEditorUpdates({
          services: mockServices,
          eventEmitter,
          appState: {} as DashboardAppStateContainer,
        })
      );

      expect(result.current).toEqual({
        isEmbeddableRendered: false,
        currentAppState: undefined,
      });
    });

    test('if dashboard is not ready', () => {
      const { result } = renderHook(() =>
        useEditorUpdates({
          services: mockServices,
          eventEmitter,
          appState: {} as DashboardAppStateContainer,
          savedDashboardInstance: {} as SavedObjectDashboard,
        })
      );

      expect(result.current).toEqual({
        isEmbeddableRendered: false,
        currentAppState: undefined,
      });
    });
  });

  let unsubscribeStateUpdatesMock: jest.Mock;
  let appState: DashboardAppStateContainer;
  let savedDashboardInstance: SavedObjectDashboard;
  let dashboard: Dashboard;

  beforeEach(() => {
    unsubscribeStateUpdatesMock = jest.fn();
    appState = ({
      getState: jest.fn(() => dashboardAppStateStub),
      subscribe: jest.fn(() => unsubscribeStateUpdatesMock),
      transitions: {
        set: jest.fn(),
        setOption: jest.fn(),
        setDashboard: jest.fn(),
      },
    } as unknown) as DashboardAppStateContainer;
    savedDashboardInstance = ({
      ...dashboardAppStateStub,
      ...{
        getQuery: () => dashboardAppStateStub.query,
        getFilters: () => dashboardAppStateStub.filters,
        optionsJSON: JSON.stringify(dashboardAppStateStub.options),
      },
    } as unknown) as SavedObjectDashboard;
    dashboard = new Dashboard(convertToSerializedDashboard(savedDashboardInstance));
  });

  test('should set up current app state and render the editor', () => {
    const { result } = renderHook(() =>
      useEditorUpdates({
        services: mockServices,
        eventEmitter,
        appState,
        savedDashboardInstance,
        dashboard,
      })
    );

    expect(result.current).toEqual({
      isEmbeddableRendered: false,
      currentAppState: dashboardAppStateStub,
    });
  });

  describe('setBreadcrumbs', () => {
    test('should not update if currentAppState and dashboard is not ready ', () => {
      renderHook(() =>
        useEditorUpdates({
          services: mockServices,
          eventEmitter,
        })
      );

      expect(mockServices.chrome.setBreadcrumbs).not.toBeCalled();
    });

    test('should not update if currentAppState is not ready ', () => {
      renderHook(() =>
        useEditorUpdates({
          services: mockServices,
          eventEmitter,
          savedDashboardInstance,
          dashboard,
        })
      );

      expect(mockServices.chrome.setBreadcrumbs).not.toBeCalled();
    });

    test('should not update if dashboard is not ready ', () => {
      renderHook(() =>
        useEditorUpdates({
          services: mockServices,
          eventEmitter,
          appState,
        })
      );

      expect(mockServices.chrome.setBreadcrumbs).not.toBeCalled();
    });

    // Uses id set by data source to determine if it is a saved object or not
    test('should update for existing dashboard if saved object exists', () => {
      savedDashboardInstance.id = '1234';
      dashboard.id = savedDashboardInstance.id;
      const { result } = renderHook(() =>
        useEditorUpdates({
          services: mockServices,
          eventEmitter,
          appState,
          savedDashboardInstance,
          dashboard,
        })
      );

      const { currentAppState } = result.current;

      const breadcrumbs = setBreadcrumbsForExistingDashboard(
        savedDashboardInstance.title,
        currentAppState!.viewMode,
        dashboard.isDirty
      );

      expect(mockServices.chrome.setBreadcrumbs).toBeCalledWith(breadcrumbs);
      expect(mockServices.chrome.docTitle.change).toBeCalledWith(savedDashboardInstance.title);
    });

    test('should update for new dashboard if saved object does not exist', () => {
      const { result } = renderHook(() =>
        useEditorUpdates({
          services: mockServices,
          eventEmitter,
          appState,
          savedDashboardInstance,
          dashboard,
        })
      );

      const { currentAppState } = result.current;

      const breadcrumbs = setBreadcrumbsForNewDashboard(
        currentAppState!.viewMode,
        dashboard.isDirty
      );

      expect(mockServices.chrome.setBreadcrumbs).toBeCalledWith(breadcrumbs);
      expect(mockServices.chrome.docTitle.change).not.toBeCalled();
    });
  });

  test('should destroy subscriptions on unmount', () => {
    const { unmount } = renderHook(() =>
      useEditorUpdates({
        services: mockServices,
        eventEmitter,
        appState,
        savedDashboardInstance,
        dashboard,
      })
    );

    unmount();

    expect(unsubscribeStateUpdatesMock).toHaveBeenCalledTimes(1);
  });

  describe('subscribe on app state updates', () => {
    test('should subscribe on appState updates', () => {
      const { result } = renderHook(() =>
        useEditorUpdates({
          services: mockServices,
          eventEmitter,
          appState,
          savedDashboardInstance,
          dashboard,
        })
      );
      // @ts-expect-error
      const listener = appState.subscribe.mock.calls[0][0];

      act(() => {
        listener(dashboardAppStateStub);
      });

      expect(result.current.currentAppState).toEqual(dashboardAppStateStub);
    });

    test('should update currentAppState', () => {
      const { result } = renderHook(() =>
        useEditorUpdates({
          services: mockServices,
          eventEmitter,
          appState,
          savedDashboardInstance,
          dashboard,
        })
      );
      // @ts-expect-error
      const listener = appState.subscribe.mock.calls[0][0];
      const newAppState = {
        ...dashboardAppStateStub,
        viewMode: ViewMode.VIEW,
      };

      act(() => {
        listener(newAppState);
      });

      expect(result.current.currentAppState).toEqual(newAppState);
    });
  });
});
