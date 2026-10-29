/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useInitPage } from './use_page_initialization';
import { useSavedExplore } from './use_saved_explore';
import { useCurrentExploreId } from './use_current_explore_id';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { executeQueries } from '../state_management/actions/query_actions';

jest.mock('./use_saved_explore', () => ({ useSavedExplore: jest.fn() }));
jest.mock('./use_current_explore_id', () => ({ useCurrentExploreId: jest.fn() }));
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: jest.fn(),
}));
jest.mock('../../hooks', () => ({ useSetEditorText: () => jest.fn() }));
jest.mock('../../../components/visualizations/visualization_builder', () => ({
  getVisualizationBuilder: () => ({ setVisConfig: jest.fn() }),
}));
jest.mock('../state_management/actions/query_actions', () => ({
  executeQueries: jest.fn(() => ({ type: 'EXECUTE_QUERIES' })),
}));

const EXPLICIT = { id: 'explicit', title: 'explicit', type: 'EXPLICIT_RUN_TYPE' };
const ORDINARY = { id: 'ordinary', title: 'ordinary', type: 'ORDINARY_TYPE' };

const savedExploreFor = (dataset: typeof EXPLICIT) => ({
  id: 'saved-1',
  title: 'Saved search',
  type: 'logs',
  kibanaSavedObjectMeta: {
    searchSourceJSON: JSON.stringify({
      query: { query: 'source=logs', language: 'PPL', dataset },
    }),
  },
});

describe('useInitPage', () => {
  const dispatch = jest.fn();

  const render = (dataset: typeof EXPLICIT) => {
    (useCurrentExploreId as jest.Mock).mockReturnValue('saved-1');
    (useSavedExplore as jest.Mock).mockReturnValue({
      savedExplore: savedExploreFor(dataset),
      error: null,
    });
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({
      services: {
        chrome: {
          docTitle: { change: jest.fn() },
          setBreadcrumbs: jest.fn(),
          recentlyAccessed: { add: jest.fn() },
        },
        osdUrlStateStorage: { get: jest.fn(() => undefined) },
        data: {
          query: {
            queryString: {
              getDatasetService: () => ({
                getType: (type: string) =>
                  type === EXPLICIT.type ? { meta: { requiresExplicitRun: true } } : { meta: {} },
              }),
            },
          },
        },
      },
    });
    const store = configureStore({ reducer: (state: unknown = {}) => state });
    jest.spyOn(store, 'dispatch').mockImplementation(dispatch);
    renderHook(() => useInitPage(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs the restored saved search for an ordinary dataset type', () => {
    render(ORDINARY);
    expect(executeQueries).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'EXECUTE_QUERIES' });
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'queryEditor/setIsQueryEditorDirty' })
    );
  });

  it('stages the restored saved search for Run for a type that requires an explicit Run', () => {
    render(EXPLICIT);
    expect(executeQueries).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'queryEditor/setIsQueryEditorDirty', payload: true })
    );
    // The previous results are cleared either way.
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'results/clearResults' })
    );
  });
});
