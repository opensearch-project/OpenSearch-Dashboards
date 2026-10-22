/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { ViewMode } from '../../../../embeddable/public';
import { handleDashboardContainerInputs } from './create_dashboard_container';
import { Variable, VariableType } from '../../variables/types';

const query = { query: '', language: 'kuery' };

const makeVariables = (current?: string[]): Variable[] => [
  { id: 'env', name: 'env', type: VariableType.Custom, current, customOptions: ['dev', 'prod'] },
];

const setup = (appStateVariables: Variable[], inputVariables: Variable[]) => {
  const input = {
    panels: {},
    filters: [],
    query,
    viewMode: ViewMode.VIEW,
    isFullScreenMode: false,
    expandedPanelId: undefined,
    variables: inputVariables,
  };
  const dashboardContainer = {
    getInput$: () => new BehaviorSubject(input),
    getInput: () => input,
    updateAppStateUrl: jest.fn(),
  };
  const appState = {
    getState: () => ({
      panels: [],
      query,
      viewMode: ViewMode.VIEW,
      fullScreenMode: false,
      expandedPanelId: undefined,
      variables: appStateVariables,
    }),
    transitions: { set: jest.fn(), setDashboard: jest.fn() },
  };
  const services = {
    opensearchDashboardsVersion: '3.0.0',
    data: {
      query: {
        filterManager: { getFilters: () => [], addFilters: jest.fn() },
        queryString: { getQuery: () => query },
      },
    },
  };
  const dashboard = { setIsDirty: jest.fn() };

  const stop = handleDashboardContainerInputs(
    services as any,
    dashboardContainer as any,
    appState as any,
    dashboard as any
  );
  stop();
  return { dashboardContainer, appState };
};

describe('handleDashboardContainerInputs variables', () => {
  test('replaces the URL history entry when only empty variables were filled in', () => {
    const { dashboardContainer, appState } = setup(
      makeVariables(undefined),
      makeVariables(['dev'])
    );

    expect(appState.transitions.setDashboard).toHaveBeenCalledWith({
      variables: makeVariables(['dev']),
    });
    expect(dashboardContainer.updateAppStateUrl).toHaveBeenCalledWith({ replace: true });
  });

  test('does not replace the URL history entry when a selected value changed', () => {
    const { dashboardContainer, appState } = setup(makeVariables(['dev']), makeVariables(['prod']));

    expect(appState.transitions.setDashboard).toHaveBeenCalledWith({
      variables: makeVariables(['prod']),
    });
    expect(dashboardContainer.updateAppStateUrl).not.toHaveBeenCalled();
  });
});
