/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { EventEmitter } from 'events';

import { useSavedDashboardInstance } from './use_saved_dashboard_instance';
import { DashboardServices } from '../../../types';
import { SavedObjectDashboard } from '../../../saved_dashboards';
import { dashboardAppStateStub } from '../stubs';
import { createDashboardServicesMock } from '../mocks';
import { Dashboard } from '../../../dashboard';
import { convertToSerializedDashboard } from '../../../saved_dashboards/_saved_dashboard';

// TODO: needs more setState tests on update
describe('useSavedDashboardInstance', () => {
  const eventEmitter = new EventEmitter();
  let mockServices: jest.Mocked<DashboardServices>;
  let isChromeVisible: boolean | undefined;
  let dashboardIdFromUrl: string | undefined;
  let savedDashboardInstance: SavedObjectDashboard;
  let dashboard: Dashboard;

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
      },
    } as unknown) as SavedObjectDashboard;
    dashboard = new Dashboard(convertToSerializedDashboard(savedDashboardInstance));
  });

  describe('should not set saved dashboard instance', () => {
    test('if id ref is blank and dashboardIdFromUrl not updated', () => {
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
});
