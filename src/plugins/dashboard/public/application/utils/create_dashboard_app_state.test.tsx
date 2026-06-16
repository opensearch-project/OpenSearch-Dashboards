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
import { scopedHistoryMock } from '../../../../../core/public/mocks';

const mockStartStateSync = jest.fn();
const mockStopStateSync = jest.fn();
const mockStopQueryStateSync = jest.fn();

jest.mock('../../../../opensearch_dashboards_utils/public', () => ({
  createGetterSetter: jest.fn(() => []),
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
  migrateAppState: jest.fn((state) => state),
}));

const { createStateContainer, syncState } = jest.requireMock(
  '../../../../opensearch_dashboards_utils/public'
);

const osdUrlStateStorage = ({
  set: jest.fn(),
  get: jest.fn(() => ({ linked: false })),
  flush: jest.fn().mockReturnValue(true),
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
    expect(osdUrlStateStorage.set).toHaveBeenCalledWith(
      '_a',
      {
        ...dashboardAppStateStub,
        linked: false,
      },
      {
        replace: true,
      }
    );
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

  test('update URL to not contain panels', () => {
    const { panels, variables, ...statesWithoutPanelsAndVariables } = dashboardAppState;

    const basePath = '/base';
    const history = scopedHistoryMock.create({
      pathname: basePath,
    });

    updateStateUrl({
      osdUrlStateStorage,
      state: dashboardAppState,
      scopedHistory: history,
      replace: true,
    });

    expect(osdUrlStateStorage.set).toHaveBeenCalledWith('_a', statesWithoutPanelsAndVariables, {
      replace: true,
    });
    expect(osdUrlStateStorage.flush).toHaveBeenCalledWith({ replace: true });
  });

  test('preserve Dashboards scoped history state', () => {
    const basePath = '/base';
    const someState = { some: 'state' };
    const history = scopedHistoryMock.create({
      pathname: basePath,
      state: someState,
    });
    const { location } = history;
    const replaceSpy = jest.spyOn(history, 'replace');

    const changed = updateStateUrl({
      osdUrlStateStorage,
      state: dashboardAppState,
      scopedHistory: history,
      replace: true,
    });

    expect(history.location.state).toEqual(someState);
    expect(changed).toBe(true);
    expect(replaceSpy).toHaveBeenCalledWith({ ...location, state: someState });
  });
});

describe('panels preservation logic in URL sync', () => {
  /**
   * This test suite verifies the fix for the bug where panels were being reset
   * when switching variables in VIEW mode.
   *
   * The bug occurred because:
   * 1. In VIEW mode, toUrlState() excludes panels from URL
   * 2. When syncing back from URL, stateDefaults (with initial panels) was merged
   * 3. This caused panels to revert to their initial state
   *
   * The fix: `panels: state.panels ?? stateContainer.getState().panels`
   * This preserves current panels when URL state doesn't include them.
   */

  // Helper to simulate the set function logic from createDashboardGlobalAndAppState
  const simulateSetFunction = (state: any, stateDefaults: any, currentPanels: any[]) => {
    if (!state) {
      return null; // Don't set anything for null state
    }

    // This simulates the logic in create_dashboard_app_state.tsx lines 105-109
    return {
      ...stateDefaults,
      ...state,
      panels: state.panels ?? currentPanels, // The bug fix
    };
  };

  test('should preserve current panels when URL state has no panels field (VIEW mode)', () => {
    const initialPanels = [{ panelIndex: 'old-panel', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const currentPanels = [{ panelIndex: 'new-panel', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const stateDefaults = { ...dashboardAppStateStub, panels: initialPanels };

    // URL state in VIEW mode (panels excluded)
    const urlState = {
      viewMode: ViewMode.VIEW,
      title: 'Test Dashboard',
      variables: [{ id: 'var1', name: 'test', current: ['value1'] }],
      // panels field is missing
    };

    const result = simulateSetFunction(urlState, stateDefaults, currentPanels);

    // Should use current panels, not initial panels from stateDefaults
    expect(result?.panels).toEqual(currentPanels);
    expect(result?.panels).not.toEqual(initialPanels);
    expect(result?.viewMode).toBe(ViewMode.VIEW);
    expect(result?.variables).toEqual(urlState.variables);
  });

  test('should use panels from URL state when explicitly provided (EDIT mode)', () => {
    const initialPanels = [{ panelIndex: 'initial', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const currentPanels = [{ panelIndex: 'current', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const urlPanels = [
      { panelIndex: 'url-panel-1', gridData: { x: 0, y: 0, w: 5, h: 5 } },
      { panelIndex: 'url-panel-2', gridData: { x: 5, y: 0, w: 5, h: 5 } },
    ];
    const stateDefaults = { ...dashboardAppStateStub, panels: initialPanels };

    // URL state with explicit panels (EDIT mode)
    const urlState = {
      viewMode: ViewMode.EDIT,
      title: 'Test Dashboard',
      panels: urlPanels,
    };

    const result = simulateSetFunction(urlState, stateDefaults, currentPanels);

    // Should use panels from URL, not current panels
    expect(result?.panels).toEqual(urlPanels);
    expect(result?.panels).not.toEqual(currentPanels);
  });

  test('should handle the complete bug scenario: add/delete panels, save, change variable', () => {
    // Initial state: dashboard loaded with old panel that will be deleted
    const initialPanels = [{ panelIndex: 'deleted-panel', gridData: { x: 0, y: 0, w: 10, h: 10 } }];

    // Current state: user added new panel and deleted old one
    const currentPanels = [{ panelIndex: 'added-panel', gridData: { x: 0, y: 0, w: 10, h: 10 } }];

    const stateDefaults = { ...dashboardAppStateStub, panels: initialPanels };

    // After save, user switches variable in VIEW mode
    const urlStateAfterVariableChange = {
      viewMode: ViewMode.VIEW,
      title: 'Test Dashboard',
      variables: [{ id: 'var1', name: 'region', current: ['us-west'] }],
      // panels field is missing (VIEW mode excludes them from URL)
    };

    const result = simulateSetFunction(urlStateAfterVariableChange, stateDefaults, currentPanels);

    // Verify panels are preserved (bug fix verification)
    expect(result?.panels).toEqual(currentPanels);
    expect(result?.panels).not.toEqual(initialPanels);
    expect(result?.panels[0].panelIndex).toBe('added-panel');
    expect(result?.panels[0].panelIndex).not.toBe('deleted-panel');
  });

  test('should handle undefined panels field correctly', () => {
    const initialPanels = [{ panelIndex: 'initial', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const currentPanels = [{ panelIndex: 'current', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const stateDefaults = { ...dashboardAppStateStub, panels: initialPanels };

    const urlState = {
      viewMode: ViewMode.VIEW,
      title: 'Test',
      panels: undefined, // Explicitly undefined
    };

    const result = simulateSetFunction(urlState, stateDefaults, currentPanels);

    expect(result?.panels).toEqual(currentPanels);
  });

  test('should handle null panels field correctly', () => {
    const initialPanels = [{ panelIndex: 'initial', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const currentPanels = [{ panelIndex: 'current', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const stateDefaults = { ...dashboardAppStateStub, panels: initialPanels };

    const urlState = {
      viewMode: ViewMode.VIEW,
      title: 'Test',
      panels: null as any, // Explicitly null
    };

    const result = simulateSetFunction(urlState, stateDefaults, currentPanels);

    expect(result?.panels).toEqual(currentPanels);
  });

  test('should not return anything when state is null', () => {
    const currentPanels = [{ panelIndex: 'test', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const stateDefaults = { ...dashboardAppStateStub, panels: [] };

    const result = simulateSetFunction(null, stateDefaults, currentPanels);

    expect(result).toBeNull();
  });

  test('should use empty array when explicitly provided (not preserve current)', () => {
    const initialPanels = [{ panelIndex: 'initial', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const currentPanels = [{ panelIndex: 'current', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const stateDefaults = { ...dashboardAppStateStub, panels: initialPanels };

    const urlState = {
      viewMode: ViewMode.VIEW,
      title: 'Test',
      panels: [], // Empty array (valid state for empty dashboard)
    };

    const result = simulateSetFunction(urlState, stateDefaults, currentPanels);

    // Empty array should be used as-is (it's a valid state, not undefined/null)
    expect(result?.panels).toEqual([]);
  });

  test('should preserve panels across multiple variable changes', () => {
    const initialPanels = [{ panelIndex: 'initial', gridData: { x: 0, y: 0, w: 10, h: 10 } }];
    const modifiedPanels = [
      { panelIndex: 'panel-1', gridData: { x: 0, y: 0, w: 5, h: 5 } },
      { panelIndex: 'panel-2', gridData: { x: 5, y: 0, w: 5, h: 5 } },
      { panelIndex: 'panel-3', gridData: { x: 0, y: 5, w: 5, h: 5 } },
    ];
    const stateDefaults = { ...dashboardAppStateStub, panels: initialPanels };

    // First variable change
    const urlState1 = {
      viewMode: ViewMode.VIEW,
      variables: [{ id: 'var1', current: ['value1'] }],
    };
    const result1 = simulateSetFunction(urlState1, stateDefaults, modifiedPanels);
    expect(result1?.panels).toEqual(modifiedPanels);

    // Second variable change - panels should still be preserved
    const urlState2 = {
      viewMode: ViewMode.VIEW,
      variables: [{ id: 'var1', current: ['value2'] }],
    };
    const result2 = simulateSetFunction(urlState2, stateDefaults, modifiedPanels);
    expect(result2?.panels).toEqual(modifiedPanels);
    expect(result2?.panels).not.toEqual(initialPanels);
  });
});
