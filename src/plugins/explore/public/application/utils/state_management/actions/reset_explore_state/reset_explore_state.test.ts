/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resetExploreStateActionCreator } from './reset_explore_state';
import {
  clearResults,
  setLegacyState,
  setQueryEditorState,
  setQueryState,
  setTabState,
  setUiState,
} from '../../slices';
import { getPreloadedState } from '../../utils/redux_persistence';
import { executeQueries } from '../query_actions';
import { detectAndSetOptimalTab } from '../detect_optimal_tab';

jest.mock('../../utils/redux_persistence');
jest.mock('../../slices');
jest.mock('../query_actions');
jest.mock('../detect_optimal_tab');

describe('resetExploreStateActionCreator', () => {
  const services = {} as any;
  const mockDispatch = jest.fn();
  const clearEditors = jest.fn();

  const preloadedState = {
    ui: { theme: 'dark' },
    results: {},
    tab: { active: 1 },
    legacy: { foo: 'bar' },
    query: { q: 'test' },
    queryEditor: { editorMode: 'SingleQuery' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getPreloadedState as jest.Mock).mockResolvedValue(preloadedState);
    (setUiState as unknown as jest.Mock).mockReturnValue({ type: 'SET_UI' });
    (clearResults as unknown as jest.Mock).mockReturnValue({ type: 'CLEAR_RESULTS' });
    (setTabState as unknown as jest.Mock).mockReturnValue({ type: 'SET_TAB' });
    (setLegacyState as unknown as jest.Mock).mockReturnValue({ type: 'SET_LEGACY' });
    (setQueryState as unknown as jest.Mock).mockReturnValue({ type: 'SET_QUERY' });
    (setQueryEditorState as unknown as jest.Mock).mockReturnValue({ type: 'SET_QUERY_EDITOR' });
    (executeQueries as unknown as jest.Mock).mockReturnValue({ type: 'EXECUTE_QUERIES' });
    (detectAndSetOptimalTab as unknown as jest.Mock).mockReturnValue({
      type: 'DETECT_OPTIMAL_TAB',
    });
  });

  it('dispatches actions in correct order with preloaded state', async () => {
    await resetExploreStateActionCreator(services, clearEditors)(mockDispatch);

    expect(getPreloadedState).toHaveBeenCalledWith(services);
    expect(clearEditors).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenNthCalledWith(1, { type: 'SET_UI' });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'CLEAR_RESULTS' });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, { type: 'SET_TAB' });
    expect(mockDispatch).toHaveBeenNthCalledWith(4, { type: 'SET_LEGACY' });
    expect(mockDispatch).toHaveBeenNthCalledWith(5, { type: 'SET_QUERY' });
    expect(mockDispatch).toHaveBeenNthCalledWith(6, { type: 'SET_QUERY_EDITOR' });
    expect(mockDispatch).toHaveBeenNthCalledWith(7, { type: 'DETECT_OPTIMAL_TAB' });
    expect(mockDispatch).toHaveBeenNthCalledWith(8, { type: 'EXECUTE_QUERIES' });
  });

  it('does not run the reset query when its dataset type requires an explicit Run', async () => {
    const explicitServices = {
      data: {
        query: {
          queryString: {
            getDatasetService: () => ({
              getType: (type: string) =>
                type === 'EXPLICIT_RUN_TYPE' ? { meta: { requiresExplicitRun: true } } : undefined,
            }),
          },
        },
      },
    } as any;
    (getPreloadedState as jest.Mock).mockResolvedValue({
      ...preloadedState,
      query: { query: '', dataset: { id: 'd', title: 'd', type: 'EXPLICIT_RUN_TYPE' } },
    });

    await resetExploreStateActionCreator(explicitServices, clearEditors)(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_QUERY' });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DETECT_OPTIMAL_TAB' });
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'EXECUTE_QUERIES' });
  });
});
