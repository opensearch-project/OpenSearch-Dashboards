/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { runQueryActionCreator } from './run_query';
import {
  setQueryStringWithHistory,
  clearResults,
  setQueryExecutionButtonStatus,
} from '../../../slices';
import {
  clearQueryStatusMap,
  incrementFetchVersion,
} from '../../../slices/query_editor/query_editor_slice';
import { executeQueries } from '../../query_actions';
import { detectAndSetOptimalTab } from '../../detect_optimal_tab';

jest.mock('../../../slices', () => ({
  setQueryStringWithHistory: jest.fn((query) => ({
    type: 'setQueryStringWithHistory',
    payload: query,
  })),
  clearResults: jest.fn(() => ({ type: 'clearResults' })),

  setQueryExecutionButtonStatus: jest.fn((status) => ({
    type: 'queryEditor/setQueryExecutionButtonStatus',
    payload: status,
  })),
}));

jest.mock('../../../slices/query_editor/query_editor_slice', () => ({
  clearQueryStatusMap: jest.fn(() => ({
    type: 'queryEditor/clearQueryStatusMap',
    payload: undefined,
  })),
  setIsQueryEditorDirty: jest.fn((isDirty) => ({
    type: 'queryEditor/setIsQueryEditorDirty',
    payload: isDirty,
  })),
  incrementFetchVersion: jest.fn(() => ({
    type: 'queryEditor/incrementFetchVersion',
  })),
}));

jest.mock('../../query_actions', () => ({
  executeQueries: jest.fn((args) => ({ type: 'executeQueries', payload: args })),
}));

jest.mock('../../detect_optimal_tab', () => ({
  detectAndSetOptimalTab: jest.fn((args) => ({
    type: 'ui/detectAndSetOptimalTab',
    payload: args,
  })),
}));

describe('runQueryActionCreator', () => {
  const mockDispatch = jest.fn();
  const mockServices = { some: 'service' } as any;
  const query = 'this is some query';

  const createMockGetState = (currentQuery: string = '') =>
    jest.fn(() => ({ query: { query: currentQuery } })) as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches standard actions and detectAndSetOptimalTab when query changes', async () => {
    const mockGetState = createMockGetState('old query');
    await runQueryActionCreator(mockServices, query)(mockDispatch, mockGetState);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(query);
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(incrementFetchVersion).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
    expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'setQueryStringWithHistory',
      payload: query,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'clearResults' });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'queryEditor/clearQueryStatusMap',
      payload: undefined,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(4, {
      type: 'queryEditor/setIsQueryEditorDirty',
      payload: false,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(5, {
      type: 'queryEditor/incrementFetchVersion',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(6, {
      type: 'executeQueries',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(7, {
      type: 'ui/detectAndSetOptimalTab',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(8, {
      type: 'queryEditor/setQueryExecutionButtonStatus',
      payload: 'REFRESH',
    });
  });

  it('skips detectAndSetOptimalTab when query has not changed (time-only refresh)', async () => {
    const mockGetState = createMockGetState(query);
    await runQueryActionCreator(mockServices, query)(mockDispatch, mockGetState);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(query);
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(detectAndSetOptimalTab).not.toHaveBeenCalled();
    expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');
  });

  it('skips detectAndSetOptimalTab when no query is provided', async () => {
    const mockGetState = createMockGetState('existing query');
    await runQueryActionCreator(mockServices)(mockDispatch, mockGetState);

    expect(setQueryStringWithHistory).not.toHaveBeenCalled();
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(incrementFetchVersion).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(detectAndSetOptimalTab).not.toHaveBeenCalled();
    expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');

    expect(mockDispatch).toHaveBeenNthCalledWith(1, { type: 'clearResults' });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'queryEditor/clearQueryStatusMap',
      payload: undefined,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'queryEditor/setIsQueryEditorDirty',
      payload: false,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(4, {
      type: 'queryEditor/incrementFetchVersion',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(5, {
      type: 'executeQueries',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(6, {
      type: 'queryEditor/setQueryExecutionButtonStatus',
      payload: 'REFRESH',
    });
  });

  it('skips detectAndSetOptimalTab when query is undefined', async () => {
    const mockGetState = createMockGetState('existing query');
    await runQueryActionCreator(mockServices, undefined)(mockDispatch, mockGetState);

    expect(setQueryStringWithHistory).not.toHaveBeenCalled();
    expect(detectAndSetOptimalTab).not.toHaveBeenCalled();
    expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');
  });

  it('dispatches detectAndSetOptimalTab when empty string differs from previous query', async () => {
    const mockGetState = createMockGetState('source = idx | stats count()');
    const emptyQuery = '';
    await runQueryActionCreator(mockServices, emptyQuery)(mockDispatch, mockGetState);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(emptyQuery);
    expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
    expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');
  });

  it('skips detectAndSetOptimalTab when both previous and new query are empty', async () => {
    const mockGetState = createMockGetState('');
    const emptyQuery = '';
    await runQueryActionCreator(mockServices, emptyQuery)(mockDispatch, mockGetState);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(emptyQuery);
    expect(detectAndSetOptimalTab).not.toHaveBeenCalled();
    expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');
  });
});
