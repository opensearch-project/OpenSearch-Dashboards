/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { runQueryActionCreator } from './run_query';
import { setQueryStringWithHistory, clearResults } from '../../../slices';
import { executeQueries } from '../../query_actions';

jest.mock('../../../slices', () => ({
  setQueryStringWithHistory: jest.fn((query) => ({
    type: 'setQueryStringWithHistory',
    payload: query,
  })),
  clearResults: jest.fn(() => ({ type: 'clearResults' })),
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

  it('dispatches setQueryStringWithHistory, clearResults, and executeQueries in order', () => {
    runQueryActionCreator(mockServices, query)(mockDispatch);

    expect(setQueryStringWithHistory).toHaveBeenCalledWith(query);
    expect(clearResults).toHaveBeenCalled();
    expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'setQueryStringWithHistory',
      payload: query,
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'clearResults' });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'executeQueries',
      payload: { services: mockServices },
    });
  });
});
