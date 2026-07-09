/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { updateSavedDashboard } from './update_saved_dashboard';
import { SavedObjectDashboard } from '../../saved_dashboards';
import { DashboardAppState } from '../../types';
import { Dashboard } from '../../dashboard';

const createServices = () => {
  const savedDashboard = ({
    searchSource: {
      setField: jest.fn(),
    },
  } as unknown) as SavedObjectDashboard;

  const timeFilter = {
    getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
    getRefreshInterval: jest.fn(() => ({ pause: true, value: 0 })),
  } as any;

  const dashboard = ({
    setState: jest.fn(),
  } as unknown) as Dashboard;

  const baseAppState = ({
    title: 'My dashboard',
    description: '',
    timeRestore: false,
    panels: [],
    options: {},
    query: { query: '', language: 'kuery' },
    filters: [],
  } as unknown) as DashboardAppState;

  return { savedDashboard, timeFilter, dashboard, baseAppState };
};

describe('updateSavedDashboard - variablesJSON', () => {
  it('leaves variablesJSON undefined when there are no variables', () => {
    const { savedDashboard, timeFilter, dashboard, baseAppState } = createServices();

    updateSavedDashboard(savedDashboard, { ...baseAppState, variables: [] }, timeFilter, dashboard);

    // Must stay undefined (not '') so the field is omitted from the full-document overwrite
    // and never written to indices that lack a `variablesJSON` strict mapping. See issue #12287.
    expect(savedDashboard.variablesJSON).toBeUndefined();
  });

  it('leaves variablesJSON undefined when variables is not provided', () => {
    const { savedDashboard, timeFilter, dashboard, baseAppState } = createServices();

    updateSavedDashboard(savedDashboard, { ...baseAppState }, timeFilter, dashboard);

    expect(savedDashboard.variablesJSON).toBeUndefined();
  });

  it('serializes variablesJSON when variables exist', () => {
    const { savedDashboard, timeFilter, dashboard, baseAppState } = createServices();
    const variables = [{ name: 'foo', type: 'custom', value: 'bar' }];

    updateSavedDashboard(
      savedDashboard,
      ({ ...baseAppState, variables } as unknown) as DashboardAppState,
      timeFilter,
      dashboard
    );

    expect(savedDashboard.variablesJSON).toBe(JSON.stringify({ variables }));
  });
});
