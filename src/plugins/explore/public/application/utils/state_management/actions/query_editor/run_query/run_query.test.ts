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
import { clearQueryStatusMap } from '../../../slices/query_editor/query_editor_slice';
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
}));

jest.mock('../../query_actions', () => ({
  executeQueries: jest.fn((args) => ({ type: 'executeQueries', payload: args })),
}));

jest.mock('../../detect_optimal_tab', () => ({
  detectAndSetOptimalTab: jest.fn((args) => ({
    type: 'detectAndSetOptimalTab',
    payload: args,
  })),
}));

describe('runQueryActionCreator', () => {
  const mockDispatch = jest.fn();
  const mockGetState = jest.fn();
  const mockServices = { some: 'service' } as any;
  const query = 'this is some query';
  const previousQuery = 'previous query';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({ query: { query: previousQuery } });
  });

  it('dispatches detectAndSetOptimalTab when query differs from previous query', async () => {
    await runQueryActionCreator(mockServices, query)(mockDispatch, mockGetState);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(query);
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
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
      type: 'detectAndSetOptimalTab',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(6, {
      type: 'executeQueries',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(7, {
      type: 'queryEditor/setQueryExecutionButtonStatus',
      payload: 'REFRESH',
    });
  });

  it('dispatches detectAndSetOptimalTab when no query is provided (undefined differs from previous)', async () => {
    await runQueryActionCreator(mockServices)(mockDispatch, mockGetState);

    expect(setQueryStringWithHistory).not.toHaveBeenCalled();
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
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
      type: 'detectAndSetOptimalTab',
      payload: { services: mockServices },
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

  it('dispatches detectAndSetOptimalTab when query is explicitly undefined (differs from previous)', async () => {
    await runQueryActionCreator(mockServices, undefined)(mockDispatch, mockGetState);

    expect(setQueryStringWithHistory).not.toHaveBeenCalled();
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
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
      type: 'detectAndSetOptimalTab',
      payload: { services: mockServices },
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

  it('dispatches detectAndSetOptimalTab when query is an empty string (differs from previous)', async () => {
    const emptyQuery = '';
    await runQueryActionCreator(mockServices, emptyQuery)(mockDispatch, mockGetState);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(emptyQuery);
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'setQueryStringWithHistory',
      payload: emptyQuery,
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
      type: 'detectAndSetOptimalTab',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(6, {
      type: 'executeQueries',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(7, {
      type: 'queryEditor/setQueryExecutionButtonStatus',
      payload: 'REFRESH',
    });
  });

  it('skips detectAndSetOptimalTab when query matches previous query (same-query refresh)', async () => {
    await runQueryActionCreator(mockServices, previousQuery)(mockDispatch, mockGetState);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(previousQuery);
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(detectAndSetOptimalTab).not.toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'setQueryStringWithHistory',
      payload: previousQuery,
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
      type: 'executeQueries',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(6, {
      type: 'queryEditor/setQueryExecutionButtonStatus',
      payload: 'REFRESH',
    });
  });
});
