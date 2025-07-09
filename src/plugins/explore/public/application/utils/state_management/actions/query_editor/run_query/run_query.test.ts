/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { runQueryActionCreator } from './run_query';
import { setQueryStringWithHistory, clearResults, setActiveTab } from '../../../slices';
import { executeQueries } from '../../query_actions';

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
jest.mock('../../query_actions', () => ({
  executeQueries: jest.fn((args) => ({ type: 'executeQueries', payload: args })),
}));

describe('runQueryActionCreator', () => {
  const mockDispatch = jest.fn();
  const mockServices = { some: 'service' } as any;
  const query = 'this is some query';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches setQueryStringWithHistory, setActiveTab, clearResults, and executeQueries in order when query is provided', () => {
    runQueryActionCreator(mockServices, query)(mockDispatch);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(query);
    expect(setActiveTab).toHaveBeenCalledWith('');
    expect(clearResults).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });

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
      type: 'executeQueries',
      payload: { services: mockServices },
    });
  });

  it('dispatches setActiveTab, clearResults and executeQueries when no query is provided', () => {
    runQueryActionCreator(mockServices)(mockDispatch);

    expect(setQueryStringWithHistory).not.toHaveBeenCalled();
    expect(setActiveTab).toHaveBeenCalledWith('');
    expect(clearResults).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'setActiveTab',
      payload: '',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'clearResults' });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'executeQueries',
      payload: { services: mockServices },
    });
  });

  it('dispatches setActiveTab, clearResults and executeQueries when query is undefined', () => {
    runQueryActionCreator(mockServices, undefined)(mockDispatch);

    expect(setQueryStringWithHistory).not.toHaveBeenCalled();
    expect(setActiveTab).toHaveBeenCalledWith('');
    expect(clearResults).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'setActiveTab',
      payload: '',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'clearResults' });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'executeQueries',
      payload: { services: mockServices },
    });
  });

  it('dispatches setQueryStringWithHistory, setActiveTab, clearResults and executeQueries when query is an empty string', () => {
    const emptyQuery = '';
    runQueryActionCreator(mockServices, emptyQuery)(mockDispatch);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(emptyQuery);
    expect(setActiveTab).toHaveBeenCalledWith('');
    expect(clearResults).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });

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
      type: 'executeQueries',
      payload: { services: mockServices },
    });
  });
});
