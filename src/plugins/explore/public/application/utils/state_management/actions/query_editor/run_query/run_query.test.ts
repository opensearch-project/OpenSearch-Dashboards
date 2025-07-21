/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { runQueryActionCreator } from './run_query';
import { setQueryStringWithHistory, clearResults, setActiveTab } from '../../../slices';
import { clearQueryStatusMap } from '../../../slices/query_editor/query_editor_slice';
import { executeQueries } from '../../query_actions';
import { detectAndSetOptimalTab } from '../../detect_optimal_tab';

jest.mock('../../../slices', () => ({
  setQueryStringWithHistory: jest.fn((query) => ({
    type: 'setQueryStringWithHistory',
    payload: query,
  })),
  clearResults: jest.fn(() => ({ type: 'clearResults' })),
  setActiveTab: jest.fn((tabId) => ({
    type: 'setActiveTab',
    payload: tabId,
  })),
}));

jest.mock('../../../slices/query_editor/query_editor_slice', () => ({
  clearQueryStatusMap: jest.fn(() => ({
    type: 'queryEditor/clearQueryStatusMap',
    payload: undefined,
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
  const mockServices = { some: 'service' } as any;
  const query = 'this is some query';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches setQueryStringWithHistory, setActiveTab, clearResults, clearQueryStatusMap, executeQueries, and detectAndSetOptimalTab in order when query is provided', async () => {
    await runQueryActionCreator(mockServices, query)(mockDispatch);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(query);
    expect(setActiveTab).toHaveBeenCalledWith('');
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'setQueryStringWithHistory',
      payload: query,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'setActiveTab',
      payload: '',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, { type: 'clearResults' });
    expect(mockDispatch).toHaveBeenNthCalledWith(4, {
      type: 'queryEditor/clearQueryStatusMap',
      payload: undefined,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(5, {
      type: 'executeQueries',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(6, {
      type: 'detectAndSetOptimalTab',
      payload: { services: mockServices },
    });
  });

  it('dispatches setActiveTab, clearResults, clearQueryStatusMap, executeQueries, and detectAndSetOptimalTab when no query is provided', async () => {
    await runQueryActionCreator(mockServices)(mockDispatch);

    expect(setQueryStringWithHistory).not.toHaveBeenCalled();
    expect(setActiveTab).toHaveBeenCalledWith('');
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'setActiveTab',
      payload: '',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'clearResults' });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'queryEditor/clearQueryStatusMap',
      payload: undefined,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(4, {
      type: 'executeQueries',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(5, {
      type: 'detectAndSetOptimalTab',
      payload: { services: mockServices },
    });
  });

  it('dispatches setActiveTab, clearResults, clearQueryStatusMap, executeQueries, and detectAndSetOptimalTab when query is undefined', async () => {
    await runQueryActionCreator(mockServices, undefined)(mockDispatch);

    expect(setQueryStringWithHistory).not.toHaveBeenCalled();
    expect(setActiveTab).toHaveBeenCalledWith('');
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'setActiveTab',
      payload: '',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'clearResults' });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'queryEditor/clearQueryStatusMap',
      payload: undefined,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(4, {
      type: 'executeQueries',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(5, {
      type: 'detectAndSetOptimalTab',
      payload: { services: mockServices },
    });
  });

  it('dispatches setQueryStringWithHistory, setActiveTab, clearResults, clearQueryStatusMap, executeQueries, and detectAndSetOptimalTab when query is an empty string', async () => {
    const emptyQuery = '';
    await runQueryActionCreator(mockServices, emptyQuery)(mockDispatch);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(emptyQuery);
    expect(setActiveTab).toHaveBeenCalledWith('');
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
    expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'setQueryStringWithHistory',
      payload: emptyQuery,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'setActiveTab',
      payload: '',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, { type: 'clearResults' });
    expect(mockDispatch).toHaveBeenNthCalledWith(4, {
      type: 'queryEditor/clearQueryStatusMap',
      payload: undefined,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(5, {
      type: 'executeQueries',
      payload: { services: mockServices },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(6, {
      type: 'detectAndSetOptimalTab',
      payload: { services: mockServices },
    });
  });
});
