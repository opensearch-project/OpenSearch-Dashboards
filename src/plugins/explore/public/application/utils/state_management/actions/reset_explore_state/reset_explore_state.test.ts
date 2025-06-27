/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resetExploreStateActionCreator } from './reset_explore_state';
import { setLegacyState } from '../../slices/legacy_slice';
import { setQueryState } from '../../slices/query_slice';
import { setResultsState } from '../../slices/results_slice';
import { setTabState } from '../../slices/tab_slice';
import { setUiState } from '../../slices/ui_slice';
import { getPreloadedState } from '../../utils/redux_persistence';
import { beginTransaction, finishTransaction } from '../transaction_actions';
import { executeQueries } from '../query_actions';

jest.mock('../../utils/redux_persistence');
jest.mock('../../slices/legacy_slice');
jest.mock('../../slices/query_slice');
jest.mock('../../slices/results_slice');
jest.mock('../../slices/tab_slice');
jest.mock('../../slices/ui_slice');
jest.mock('../transaction_actions');
jest.mock('../query_actions');

describe('resetExploreStateActionCreator', () => {
  const services = {} as any;
  const mockDispatch = jest.fn();

  const preloadedState = {
    ui: { theme: 'dark' },
    results: { data: [] },
    tab: { active: 1 },
    legacy: { foo: 'bar' },
    query: { q: 'test' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getPreloadedState as jest.Mock).mockResolvedValue(preloadedState);
    ((setUiState as unknown) as jest.Mock).mockReturnValue({ type: 'SET_UI' });
    ((setResultsState as unknown) as jest.Mock).mockReturnValue({ type: 'SET_RESULTS' });
    ((setTabState as unknown) as jest.Mock).mockReturnValue({ type: 'SET_TAB' });
    ((setLegacyState as unknown) as jest.Mock).mockReturnValue({ type: 'SET_LEGACY' });
    ((setQueryState as unknown) as jest.Mock).mockReturnValue({ type: 'SET_QUERY' });
    ((beginTransaction as unknown) as jest.Mock).mockReturnValue({ type: 'BEGIN_TX' });
    ((finishTransaction as unknown) as jest.Mock).mockReturnValue({ type: 'FINISH_TX' });
    ((executeQueries as unknown) as jest.Mock).mockReturnValue({ type: 'EXECUTE_QUERIES' });
  });

  it('dispatches actions in correct order with preloaded state', async () => {
    await resetExploreStateActionCreator(services)(mockDispatch);

    expect(getPreloadedState).toHaveBeenCalledWith(services);
    expect(mockDispatch).toHaveBeenNthCalledWith(1, { type: 'BEGIN_TX' });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'SET_UI' });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, { type: 'SET_RESULTS' });
    expect(mockDispatch).toHaveBeenNthCalledWith(4, { type: 'SET_TAB' });
    expect(mockDispatch).toHaveBeenNthCalledWith(5, { type: 'SET_LEGACY' });
    expect(mockDispatch).toHaveBeenNthCalledWith(6, { type: 'SET_QUERY' });
    expect(mockDispatch).toHaveBeenNthCalledWith(7, { type: 'EXECUTE_QUERIES' });
    expect(mockDispatch).toHaveBeenNthCalledWith(8, { type: 'FINISH_TX' });
  });
});
