/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
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
    isChromeVisible = true;
    dashboardIdFromUrl = '1234';
    savedDashboardInstance = ({
      ...dashboardAppStateStub,
      ...{
        getQuery: () => dashboardAppStateStub.query,
        getFilters: () => dashboardAppStateStub.filters,
        optionsJSON: JSON.stringify(dashboardAppStateStub.options),
        getFullPath: () => `/${dashboardIdFromUrl}`,
      },
    } as unknown) as SavedObjectDashboard;
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
      expect(getDashboardInstance).toBeCalledWith(mockServices, dashboardIdFromUrl);
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
      expect(getDashboardInstance).toBeCalledWith(mockServices, dashboardIdFromUrlNext);
    });

    test('if dashboard is being created', async () => {
      let hook;
      mockServices.history.location.pathname = '/create';

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
      expect(getDashboardInstance).toBeCalledWith(mockServices);
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
      expect(getDashboardInstance).toBeCalledWith(mockServices, dashboardIdFromUrl);
      expect(mockServices.notifications.toasts.addDanger).toBeCalled();
      expect(mockServices.history.replace).toBeCalledWith(DashboardConstants.LANDING_PAGE_PATH);
    });

    test('if dashboard is being created', async () => {
      let hook;
      getDashboardInstance.mockImplementation(() => {
        throw new Error();
      });
      mockServices.history.location.pathname = '/create';

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
      expect(getDashboardInstance).toBeCalledWith(mockServices);
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
      expect(getDashboardInstance).toBeCalledWith(mockServices, 'create');
      expect(mockServices.notifications.toasts.addWarning).toBeCalled();
      expect(mockServices.history.replace).toBeCalledWith({
        ...mockServices.history.location,
        pathname: DashboardConstants.CREATE_NEW_DASHBOARD_URL,
      });
    });
  });
});
