/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { EventEmitter } from 'events';
import { SavedObjectNotFound } from '../../../../../opensearch_dashboards_utils/public';

import { useSavedDashboardInstance } from './use_saved_dashboard_instance';
import { DashboardServices } from '../../../types';
import { SavedObjectDashboard } from '../../../saved_dashboards';
import { dashboardAppStateStub } from '../stubs';
import { createDashboardServicesMock } from '../mocks';
import { Dashboard } from '../../../dashboard';
import { convertToSerializedDashboard } from '../../../saved_dashboards/_saved_dashboard';
import { DashboardConstants } from '../../../dashboard_constants';

jest.mock('../get_dashboard_instance');

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe('useSavedDashboardInstance', () => {
  const eventEmitter = new EventEmitter();
  let mockServices: jest.Mocked<DashboardServices>;
  let isChromeVisible: boolean | undefined;
  let dashboardIdFromUrl: string | undefined;
  let savedDashboardInstance: SavedObjectDashboard;
  let dashboard: Dashboard;
  const { getDashboardInstance } = jest.requireMock('../get_dashboard_instance');

  beforeEach(() => {
    mockServices = createDashboardServicesMock();
    mockServices.history.location.pathname = '';
    isChromeVisible = true;
    dashboardIdFromUrl = '1234';
    getDashboardInstance.mockReset();
    savedDashboardInstance = {
      ...dashboardAppStateStub,
      ...{
        id: dashboardIdFromUrl,
        getQuery: () => dashboardAppStateStub.query,
        getFilters: () => dashboardAppStateStub.filters,
        optionsJSON: JSON.stringify(dashboardAppStateStub.options),
        getFullPath: () => `/${dashboardIdFromUrl}`,
        getOpenSearchType: () => 'dashboard',
      },
    } as unknown as SavedObjectDashboard;
    dashboard = new Dashboard(convertToSerializedDashboard(savedDashboardInstance));
    getDashboardInstance.mockImplementation(() => ({
      savedDashboard: savedDashboardInstance,
      dashboard,
    }));
  });

  describe('should not set saved dashboard instance', () => {
    test('if id ref is blank and dashboardIdFromUrl is undefined', () => {
      dashboardIdFromUrl = undefined;

      const { result } = renderHook(() =>
        useSavedDashboardInstance({
          services: mockServices,
          eventEmitter,
          isChromeVisible,
          dashboardIdFromUrl,
        })
      );

      expect(result.current).toEqual({});
    });

    test('if chrome is not visible', () => {
      isChromeVisible = undefined;

      const { result } = renderHook(() =>
        useSavedDashboardInstance({
          services: mockServices,
          eventEmitter,
          isChromeVisible,
          dashboardIdFromUrl,
        })
      );

      expect(result.current).toEqual({});
    });
  });

  describe('should set saved dashboard instance', () => {
    test('if dashboardIdFromUrl is set', async () => {
      let hook;

      await act(async () => {
        hook = renderHook(() =>
          useSavedDashboardInstance({
            services: mockServices,
            eventEmitter,
            isChromeVisible,
            dashboardIdFromUrl,
          })
        );
      });

      expect(hook!.result.current).toEqual({
        savedDashboard: savedDashboardInstance,
        dashboard,
      });
      expect(getDashboardInstance).toHaveBeenCalledWith(mockServices, dashboardIdFromUrl);
    });

    test('if dashboardIdFromUrl is set and updated', async () => {
      let hook;

      // Force current dashboardIdFromUrl to be different
      const dashboardIdFromUrlNext = `${dashboardIdFromUrl}next`;
      const saveDashboardInstanceNext = {
        ...savedDashboardInstance,
        id: dashboardIdFromUrlNext,
      } as SavedObjectDashboard;
      const dashboardNext = {
        ...dashboard,
        id: dashboardIdFromUrlNext,
      } as Dashboard;
      getDashboardInstance.mockImplementation(() => ({
        savedDashboard: saveDashboardInstanceNext,
        dashboard: dashboardNext,
      }));
      await act(async () => {
        hook = renderHook(
          ({ hookDashboardIdFromUrl }) =>
            useSavedDashboardInstance({
              services: mockServices,
              eventEmitter,
              isChromeVisible,
              dashboardIdFromUrl: hookDashboardIdFromUrl,
            }),
          {
            initialProps: {
              hookDashboardIdFromUrl: dashboardIdFromUrl,
            },
          }
        );

        hook.rerender({ hookDashboardIdFromUrl: dashboardIdFromUrlNext });
      });

      expect(hook!.result.current).toEqual({
        savedDashboard: saveDashboardInstanceNext,
        dashboard: dashboardNext,
      });
      expect(getDashboardInstance).toHaveBeenCalledWith(mockServices, dashboardIdFromUrlNext);
    });

    test('if dashboard is being created', async () => {
      let hook;
      mockServices.history.location.pathname = DashboardConstants.CREATE_NEW_DASHBOARD_URL;

      await act(async () => {
        hook = renderHook(() =>
          useSavedDashboardInstance({
            services: mockServices,
            eventEmitter,
            isChromeVisible,
            dashboardIdFromUrl: undefined,
          })
        );
      });

      expect(hook!.result.current).toEqual({
        savedDashboard: savedDashboardInstance,
        dashboard,
      });
      expect(getDashboardInstance).toHaveBeenCalledWith(mockServices);
    });

    test('if route changes from saved dashboard to create', async () => {
      let hook;
      const createSavedDashboardInstance = {
        ...savedDashboardInstance,
        id: undefined,
      } as unknown as SavedObjectDashboard;
      const createDashboard = new Dashboard(
        convertToSerializedDashboard(createSavedDashboardInstance)
      );

      getDashboardInstance
        .mockImplementationOnce(() => ({
          savedDashboard: savedDashboardInstance,
          dashboard,
        }))
        .mockImplementationOnce(() => ({
          savedDashboard: createSavedDashboardInstance,
          dashboard: createDashboard,
        }));

      await act(async () => {
        hook = renderHook(
          ({ hookDashboardIdFromUrl }) =>
            useSavedDashboardInstance({
              services: mockServices,
              eventEmitter,
              isChromeVisible,
              dashboardIdFromUrl: hookDashboardIdFromUrl,
            }),
          {
            initialProps: {
              hookDashboardIdFromUrl: dashboardIdFromUrl,
            },
          }
        );
      });

      mockServices.history.location.pathname = '/create';

      await act(async () => {
        hook!.rerender({ hookDashboardIdFromUrl: undefined });
      });

      expect(hook!.result.current).toEqual({
        savedDashboard: createSavedDashboardInstance,
        dashboard: createDashboard,
      });
      expect(getDashboardInstance).toHaveBeenCalledWith(mockServices, dashboardIdFromUrl);
      expect(getDashboardInstance).toHaveBeenCalledWith(mockServices);
    });

    test('if a stale saved dashboard request resolves after route changes to create, it is ignored', async () => {
      const createSavedDashboardInstance = {
        ...savedDashboardInstance,
        id: undefined,
      } as unknown as SavedObjectDashboard;
      const createDashboard = new Dashboard(
        convertToSerializedDashboard(createSavedDashboardInstance)
      );
      const savedDashboardRequest = createDeferred<{
        savedDashboard: SavedObjectDashboard;
        dashboard: Dashboard;
      }>();
      const createDashboardRequest = createDeferred<{
        savedDashboard: SavedObjectDashboard;
        dashboard: Dashboard;
      }>();

      getDashboardInstance
        .mockImplementationOnce(() => savedDashboardRequest.promise)
        .mockImplementationOnce(() => createDashboardRequest.promise);

      const hook = renderHook(
        ({ hookDashboardIdFromUrl }) =>
          useSavedDashboardInstance({
            services: mockServices,
            eventEmitter,
            isChromeVisible,
            dashboardIdFromUrl: hookDashboardIdFromUrl,
          }),
        {
          initialProps: {
            hookDashboardIdFromUrl: dashboardIdFromUrl,
          },
        }
      );

      expect(hook.result.current).toEqual({});

      mockServices.history.location.pathname = DashboardConstants.CREATE_NEW_DASHBOARD_URL;

      await act(async () => {
        hook.rerender({ hookDashboardIdFromUrl: undefined });
      });

      await act(async () => {
        createDashboardRequest.resolve({
          savedDashboard: createSavedDashboardInstance,
          dashboard: createDashboard,
        });
        await Promise.resolve();
      });

      await waitFor(() =>
        expect(hook.result.current).toEqual({
          savedDashboard: createSavedDashboardInstance,
          dashboard: createDashboard,
        })
      );

      await act(async () => {
        savedDashboardRequest.resolve({
          savedDashboard: savedDashboardInstance,
          dashboard,
        });
        await Promise.resolve();
      });

      expect(hook.result.current).toEqual({
        savedDashboard: createSavedDashboardInstance,
        dashboard: createDashboard,
      });
      expect(mockServices.chrome.recentlyAccessed.add).not.toHaveBeenCalled();
    });

    test('if route changes from create to saved dashboard', async () => {
      let hook;
      mockServices.history.location.pathname = DashboardConstants.CREATE_NEW_DASHBOARD_URL;
      const createSavedDashboardInstance = {
        ...savedDashboardInstance,
        id: undefined,
      } as unknown as SavedObjectDashboard;
      const createDashboard = new Dashboard(
        convertToSerializedDashboard(createSavedDashboardInstance)
      );

      const nextDashboardIdFromUrl = 'dashboard-next';
      const savedDashboardInstanceNext = {
        ...savedDashboardInstance,
        id: nextDashboardIdFromUrl,
      } as SavedObjectDashboard;
      const dashboardNext = {
        ...dashboard,
        id: nextDashboardIdFromUrl,
      } as Dashboard;

      getDashboardInstance
        .mockImplementationOnce(() => ({
          savedDashboard: createSavedDashboardInstance,
          dashboard: createDashboard,
        }))
        .mockImplementationOnce(() => ({
          savedDashboard: savedDashboardInstanceNext,
          dashboard: dashboardNext,
        }));

      await act(async () => {
        hook = renderHook(
          ({ hookDashboardIdFromUrl }) =>
            useSavedDashboardInstance({
              services: mockServices,
              eventEmitter,
              isChromeVisible,
              dashboardIdFromUrl: hookDashboardIdFromUrl,
            }),
          {
            initialProps: {
              hookDashboardIdFromUrl: undefined,
            },
          }
        );
      });

      mockServices.history.location.pathname = '/view/dashboard-next';

      await act(async () => {
        hook!.rerender({ hookDashboardIdFromUrl: nextDashboardIdFromUrl });
      });

      expect(hook!.result.current).toEqual({
        savedDashboard: savedDashboardInstanceNext,
        dashboard: dashboardNext,
      });
      expect(getDashboardInstance).toHaveBeenCalledWith(mockServices);
      expect(getDashboardInstance).toHaveBeenCalledWith(mockServices, nextDashboardIdFromUrl);
    });
  });

  describe('handle errors', () => {
    test('if dashboardIdFromUrl is set', async () => {
      let hook;
      getDashboardInstance.mockImplementation(() => {
        throw new SavedObjectNotFound('dashboard');
      });

      await act(async () => {
        hook = renderHook(() =>
          useSavedDashboardInstance({
            services: mockServices,
            eventEmitter,
            isChromeVisible,
            dashboardIdFromUrl,
          })
        );
      });

      expect(hook!.result.current).toEqual({});
      expect(getDashboardInstance).toHaveBeenCalledWith(mockServices, dashboardIdFromUrl);
      expect(mockServices.notifications.toasts.addDanger).toHaveBeenCalled();
      expect(mockServices.history.replace).toHaveBeenCalledWith(
        DashboardConstants.LANDING_PAGE_PATH
      );
    });

    test('if dashboard is being created', async () => {
      let hook;
      getDashboardInstance.mockImplementation(() => {
        throw new Error();
      });
      mockServices.history.location.pathname = DashboardConstants.CREATE_NEW_DASHBOARD_URL;

      await act(async () => {
        hook = renderHook(() =>
          useSavedDashboardInstance({
            services: mockServices,
            eventEmitter,
            isChromeVisible,
            dashboardIdFromUrl: undefined,
          })
        );
      });

      expect(hook!.result.current).toEqual({});
      expect(getDashboardInstance).toHaveBeenCalledWith(mockServices);
    });

    test('if legacy dashboard is being created', async () => {
      let hook;
      getDashboardInstance.mockImplementation(() => {
        throw new SavedObjectNotFound('dashboard');
      });

      await act(async () => {
        hook = renderHook(() =>
          useSavedDashboardInstance({
            services: mockServices,
            eventEmitter,
            isChromeVisible,
            dashboardIdFromUrl: 'create',
          })
        );
      });

      expect(hook!.result.current).toEqual({});
      expect(getDashboardInstance).toHaveBeenCalledWith(mockServices, 'create');
      expect(mockServices.notifications.toasts.addWarning).toHaveBeenCalled();
      expect(mockServices.history.replace).toHaveBeenCalledWith({
        ...mockServices.history.location,
        pathname: DashboardConstants.CREATE_NEW_DASHBOARD_URL,
      });
    });
  });
});
