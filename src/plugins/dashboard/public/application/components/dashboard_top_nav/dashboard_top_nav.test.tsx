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

jest.mock(
  'lodash',
  () => ({
    ...jest.requireActual('lodash'),
    // mock debounce to fire immediately with no internal timer
    debounce: (func: any) => {
      function debounced(this: any, ...args: any[]) {
        return func.apply(this, args);
      }
      return debounced;
    },
  }),
  { virtual: true }
);

import { I18nProvider } from '@osd/i18n/react';
import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { DashboardTopNav } from './dashboard_top_nav';
import React from 'react';
import { DashboardAppState, DashboardAppStateContainer } from '../../../types';
import { Dashboard } from '../../../dashboard';
import { DashboardContainer } from '../../embeddable';
import { createDashboardServicesMock } from '../../utils/mocks';
import { mount } from 'enzyme';
import { TopNavMenu, TopNavControls as HeaderControl } from 'src/plugins/navigation/public';
import { dashboardAppStateStub } from '../../utils/stubs';
import { ViewMode } from 'src/plugins/embeddable/public';

let mockURL = '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    search: mockURL,
    pathname: '',
    hash: '',
    state: undefined,
  }),
}));

function wrapDashboardTopNavInContext(
  mockServices: any,
  currentState: DashboardAppState,
  includeKeyboardShortcut = false
) {
  const { keyboardShortcut, ...servicesWithoutKeyboardShortcut } = mockServices;

  const services = {
    ...servicesWithoutKeyboardShortcut,
    dashboardCapabilities: {
      saveQuery: true,
    },
    navigation: {
      ui: { TopNavMenu, HeaderControl },
    },
    // Only include keyboard shortcut service when explicitly requested
    ...(includeKeyboardShortcut &&
      keyboardShortcut && {
        keyboardShortcut,
      }),
  };

  const topNavProps = {
    isChromeVisible: false,
    savedDashboardInstance: {},
    appState: {
      getState: () => currentState,
    } as DashboardAppStateContainer,
    dashboard: {} as Dashboard,
    currentAppState: currentState,
    isEmbeddableRendered: true,
    currentContainer: {} as DashboardContainer,
    indexPatterns: [],
    dashboardIdFromUrl: '',
  };

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <DashboardTopNav {...topNavProps} />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
}

describe('Dashboard top nav', () => {
  let mockServices: any;
  let currentState: DashboardAppState;

  beforeEach(() => {
    mockServices = createDashboardServicesMock();
    currentState = dashboardAppStateStub;
  });

  test('render with all components', async () => {
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('render in full screen mode, no componenets should be shown', async () => {
    currentState.fullScreenMode = true;
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('render in full screen mode with appended URL param but none of the componenets can be forced show', async () => {
    currentState.fullScreenMode = true;
    mockURL =
      '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&show-time-filter=true';
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('render in embed mode', async () => {
    mockURL =
      '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&embed=true';
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('render in embed mode, components can be forced show by appending URL param', async () => {
    mockURL =
      '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&embed=true&show-time-filter=true';
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  test('render in embed mode, and force hide filter bar', async () => {
    mockURL =
      '?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&embed=true&hide-filter-bar=true';
    const component = mount(wrapDashboardTopNavInContext(mockServices, currentState));

    // Ensure all promises resolve
    await new Promise((resolve) => process.nextTick(resolve));
    // Ensure the state changes are reflected
    component.update();

    expect(component).toMatchSnapshot();
  });

  describe('Keyboard Shortcuts Integration', () => {
    let mockUseKeyboardShortcut: jest.Mock;
    let mockRegister: jest.Mock;
    let mockUnregister: jest.Mock;

    beforeEach(() => {
      mockUseKeyboardShortcut = jest.fn();
      mockRegister = jest.fn();
      mockUnregister = jest.fn();

      Object.defineProperty(document, 'querySelector', {
        value: jest.fn(),
        writable: true,
        configurable: true,
      });
    });

    function wrapWithKeyboardShortcuts(state: DashboardAppState) {
      const services = {
        ...mockServices,
        dashboardCapabilities: { saveQuery: true },
        navigation: { ui: { TopNavMenu, HeaderControl } },
        keyboardShortcut: {
          useKeyboardShortcut: mockUseKeyboardShortcut,
          register: mockRegister,
          unregister: mockUnregister,
        },
      };

      const topNavProps = {
        isChromeVisible: false,
        savedDashboardInstance: { id: 'test-dashboard', title: 'Test Dashboard' },
        appState: {
          getState: () => state,
          transitions: { set: jest.fn(), setDashboard: jest.fn(), setOption: jest.fn() },
        } as any,
        dashboard: { save: jest.fn() } as any,
        currentAppState: state,
        isEmbeddableRendered: true,
        currentContainer: {} as DashboardContainer,
        indexPatterns: [],
        dashboardIdFromUrl: 'test-dashboard',
      };

      return (
        <I18nProvider>
          <OpenSearchDashboardsContextProvider services={services}>
            <DashboardTopNav {...topNavProps} />
          </OpenSearchDashboardsContextProvider>
        </I18nProvider>
      );
    }

    test('registers toggle edit shortcut', async () => {
      const component = mount(
        wrapWithKeyboardShortcuts({ ...currentState, viewMode: ViewMode.VIEW })
      );
      await new Promise((resolve) => process.nextTick(resolve));
      component.update();

      expect(mockUseKeyboardShortcut).toHaveBeenCalledWith({
        id: 'toggle_dashboard_edit',
        pluginId: 'dashboard',
        name: expect.any(String),
        category: expect.any(String),
        keys: 'shift+e',
        execute: expect.any(Function),
      });
    });

    test('registers save and add shortcuts in edit mode', async () => {
      const component = mount(
        wrapWithKeyboardShortcuts({ ...currentState, viewMode: ViewMode.EDIT })
      );
      await new Promise((resolve) => process.nextTick(resolve));
      component.update();

      expect(mockRegister).toHaveBeenCalledWith({
        id: 'save_dashboard',
        pluginId: 'dashboard',
        name: expect.any(String),
        category: expect.any(String),
        keys: 'cmd+s',
        execute: expect.any(Function),
      });

      expect(mockRegister).toHaveBeenCalledWith({
        id: 'add_panel_to_dashboard',
        pluginId: 'dashboard',
        name: expect.any(String),
        category: expect.any(String),
        keys: 'a',
        execute: expect.any(Function),
      });
    });

    test('does not register save/add shortcuts in view mode', async () => {
      const component = mount(
        wrapWithKeyboardShortcuts({ ...currentState, viewMode: ViewMode.VIEW })
      );
      await new Promise((resolve) => process.nextTick(resolve));
      component.update();

      const saveCall = mockRegister.mock.calls.find((call) => call[0].id === 'save_dashboard');
      const addCall = mockRegister.mock.calls.find(
        (call) => call[0].id === 'add_panel_to_dashboard'
      );

      expect(saveCall).toBeUndefined();
      expect(addCall).toBeUndefined();
    });

    test('add panel shortcut executes successfully', async () => {
      const mockGetEmbeddableFactories = jest.fn();
      const mockGetEmbeddableFactory = jest.fn();

      function wrapWithMockedServices(state: DashboardAppState) {
        const services = {
          ...mockServices,
          dashboardCapabilities: { saveQuery: true },
          navigation: { ui: { TopNavMenu, HeaderControl } },
          keyboardShortcut: {
            useKeyboardShortcut: mockUseKeyboardShortcut,
            register: mockRegister,
            unregister: mockUnregister,
          },
          embeddable: {
            getEmbeddableFactories: mockGetEmbeddableFactories,
            getEmbeddableFactory: mockGetEmbeddableFactory,
          },
          notifications: { toasts: { addSuccess: jest.fn(), addDanger: jest.fn() } },
          overlays: { openFlyout: jest.fn(), openModal: jest.fn() },
          savedObjects: { client: {} },
          uiSettings: { get: jest.fn() },
          data: {},
          application: {},
        };

        const topNavProps = {
          isChromeVisible: false,
          savedDashboardInstance: { id: 'test-dashboard', title: 'Test Dashboard' },
          appState: {
            getState: () => state,
            transitions: { set: jest.fn(), setDashboard: jest.fn(), setOption: jest.fn() },
          } as any,
          dashboard: { save: jest.fn() } as any,
          currentAppState: state,
          isEmbeddableRendered: true,
          currentContainer: {
            id: 'test-container',
            type: 'dashboard',
          } as any,
          indexPatterns: [],
          dashboardIdFromUrl: 'test-dashboard',
        };

        return (
          <I18nProvider>
            <OpenSearchDashboardsContextProvider services={services}>
              <DashboardTopNav {...topNavProps} />
            </OpenSearchDashboardsContextProvider>
          </I18nProvider>
        );
      }

      const component = mount(wrapWithMockedServices({ ...currentState, viewMode: ViewMode.EDIT }));
      await new Promise((resolve) => process.nextTick(resolve));
      component.update();

      const addCall = mockRegister.mock.calls.find(
        (call) => call[0].id === 'add_panel_to_dashboard'
      );
      expect(addCall).toBeDefined();

      expect(() => addCall[0].execute()).not.toThrow();
    });

    test('cleans up shortcuts on unmount', async () => {
      const component = mount(
        wrapWithKeyboardShortcuts({ ...currentState, viewMode: ViewMode.EDIT })
      );
      await new Promise((resolve) => process.nextTick(resolve));
      component.update();

      component.unmount();

      expect(mockUnregister).toHaveBeenCalledWith({
        id: 'save_dashboard',
        pluginId: 'dashboard',
      });
      expect(mockUnregister).toHaveBeenCalledWith({
        id: 'add_panel_to_dashboard',
        pluginId: 'dashboard',
      });
    });
  });
});
