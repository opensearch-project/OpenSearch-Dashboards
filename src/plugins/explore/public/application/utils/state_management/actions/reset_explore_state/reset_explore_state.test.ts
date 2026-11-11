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
import { refreshAiAvailability } from '../../middleware/ai_availability_middleware';

jest.mock('../../utils/redux_persistence');
jest.mock('../../slices');
jest.mock('../query_actions');
jest.mock('../detect_optimal_tab');

describe('resetExploreStateActionCreator', () => {
  const services = {} as any;
  const mockDispatch = jest.fn();
  const clearEditors = jest.fn();

  const defaultGetState = jest.fn(() => ({
    queryEditor: { promptModeIsAvailable: false, summaryAgentIsAvailable: false },
  }));

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
    await resetExploreStateActionCreator(services, clearEditors)(
      mockDispatch,
      defaultGetState as any
    );

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

    await resetExploreStateActionCreator(explicitServices, clearEditors)(
      mockDispatch,
      defaultGetState as any
    );

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_QUERY' });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DETECT_OPTIMAL_TAB' });
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'EXECUTE_QUERIES' });
  });

  it('keeps the current AI flags and refreshes them in the background after the reset', async () => {
    (getPreloadedState as jest.Mock).mockResolvedValue({
      ...preloadedState,
      query: { query: '', dataset: { id: 'd', title: 'd', type: 'INDEX_PATTERN' } },
      queryEditor: {
        editorMode: 'SingleQuery',
        promptModeIsAvailable: false,
        summaryAgentIsAvailable: false,
      },
    });
    const getState = jest.fn(() => ({
      queryEditor: { promptModeIsAvailable: true, summaryAgentIsAvailable: true },
    }));

    await resetExploreStateActionCreator(services, clearEditors)(mockDispatch, getState as any);

    expect(setQueryEditorState).toHaveBeenCalledWith({
      editorMode: 'SingleQuery',
      promptModeIsAvailable: true,
      summaryAgentIsAvailable: true,
    });
    const types = mockDispatch.mock.calls.map(([a]) => a?.type);
    expect(types.indexOf(refreshAiAvailability.type)).toBeGreaterThan(
      types.indexOf('SET_QUERY_EDITOR')
    );
    expect(types.indexOf(refreshAiAvailability.type)).toBeLessThan(
      types.indexOf('EXECUTE_QUERIES')
    );
  });

  it('turns the AI flags off and does not re-probe when the reset state has no dataset', async () => {
    (getPreloadedState as jest.Mock).mockResolvedValue({
      ...preloadedState,
      query: { query: '', dataset: undefined },
      queryEditor: { editorMode: 'SingleQuery', promptModeIsAvailable: false },
    });
    const getState = jest.fn(() => ({
      queryEditor: { promptModeIsAvailable: true, summaryAgentIsAvailable: true },
    }));

    await resetExploreStateActionCreator(services, clearEditors)(mockDispatch, getState as any);

    expect(setQueryEditorState).toHaveBeenCalledWith({
      editorMode: 'SingleQuery',
      promptModeIsAvailable: false,
    });
    const types = mockDispatch.mock.calls.map(([a]) => a?.type);
    expect(types).not.toContain(refreshAiAvailability.type);
  });
});
