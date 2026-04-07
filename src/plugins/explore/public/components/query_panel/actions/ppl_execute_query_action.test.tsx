/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react';

const mockDispatch = jest.fn();
const mockUseAssistantAction = jest.fn();
const mockSetEditorTextWithQuery = jest.fn();
const mockLoadQueryActionCreator = jest.fn();
const mockSetTime = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      data: {
        query: {
          timefilter: { timefilter: { setTime: mockSetTime } },
          queryString: { getQuery: jest.fn() },
        },
      },
      notifications: { toasts: { addSuccess: jest.fn(), addError: jest.fn() } },
      contextProvider: {
        hooks: { useAssistantAction: mockUseAssistantAction },
      },
    },
  }),
}));

jest.mock('../../../application/utils/state_management/actions/query_editor/load_query', () => ({
  // @ts-expect-error TS7019 TODO(ts-upgrade): fixme
  loadQueryActionCreator: (...args) => mockLoadQueryActionCreator(...args),
}));

jest.mock(
  '../../../application/utils/state_management/slices/query_editor/query_editor_slice',
  () => ({
    setDateRange: jest.fn((payload) => ({ type: 'queryEditor/setDateRange', payload })),
  })
);

jest.mock('../../../application/utils/state_management/store', () => ({}));

jest.mock('../../../application/utils/state_management/types', () => ({
  QueryExecutionStatus: {
    UNINITIALIZED: 'uninitialized',
    LOADING: 'loading',
    READY: 'ready',
    ERROR: 'error',
    NO_RESULTS: 'no_results',
  },
}));

jest.mock('../../../application/hooks', () => ({
  useSetEditorTextWithQuery: jest.fn(),
}));

import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import { usePPLExecuteQueryAction } from './ppl_execute_query_action';

describe('usePPLExecuteQueryAction', () => {
  // @ts-expect-error TS7034 TODO(ts-upgrade): fixme
  let initialCallCount;

  // @ts-expect-error TS7006 TODO(ts-upgrade): fixme
  const makeStatus = (status, error) => ({
    status,
    elapsedMs: undefined,
    startTime: undefined,
    error,
  });

  beforeEach(() => {
    initialCallCount = mockUseAssistantAction.mock.calls.length;
    mockDispatch.mockClear();
    mockSetEditorTextWithQuery.mockClear();
    mockLoadQueryActionCreator.mockClear();
    mockSetTime.mockClear();

    // @ts-expect-error TS2554 TODO(ts-upgrade): fixme
    mockDispatch.mockResolvedValue(makeStatus(QueryExecutionStatus.READY));
    mockLoadQueryActionCreator.mockReturnValue({ type: 'LOAD_QUERY' });
  });

  const renderAndGetHandler = () => {
    act(() => {
      renderHook(() => usePPLExecuteQueryAction(mockSetEditorTextWithQuery));
    });
    const currentCallCount = mockUseAssistantAction.mock.calls.length;
    // @ts-expect-error TS7005 TODO(ts-upgrade): fixme
    expect(currentCallCount).toBeGreaterThan(initialCallCount);
    return mockUseAssistantAction.mock.calls[currentCallCount - 1][0].handler;
  };

  it('should register assistant action with correct name and required parameters', () => {
    renderAndGetHandler();
    const latestCall =
      mockUseAssistantAction.mock.calls[mockUseAssistantAction.mock.calls.length - 1][0];
    expect(latestCall.name).toBe('execute_ppl_query');
    expect(latestCall.parameters.required).toContain('query');
    expect(latestCall.handler).toBeInstanceOf(Function);
  });

  it('should execute query and return success on READY status', async () => {
    // @ts-expect-error TS2554 TODO(ts-upgrade): fixme
    mockDispatch.mockResolvedValue(makeStatus(QueryExecutionStatus.READY));
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs | head 10' });

    expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
      expect.anything(),
      mockSetEditorTextWithQuery,
      'source=logs | head 10'
    );
    expect(result).toEqual({
      success: true,
      executed: true,
      query: 'source=logs | head 10',
      resultsCount: undefined,
      timeRange: undefined,
      message: 'Query updated and executed successfully.',
    });
  });

  it('should return success with resultsCount 0 on NO_RESULTS status', async () => {
    // @ts-expect-error TS2554 TODO(ts-upgrade): fixme
    mockDispatch.mockResolvedValue(makeStatus(QueryExecutionStatus.NO_RESULTS));
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs | head 10' });

    expect(result).toEqual({
      success: true,
      executed: true,
      query: 'source=logs | head 10',
      resultsCount: 0,
      timeRange: undefined,
      message: 'Query executed successfully but returned no results.',
    });
  });

  it('should return failure using Redux error status when query is invalid', async () => {
    // loadQueryActionCreator swallows the re-throw and returns ERROR status from Redux
    mockDispatch.mockResolvedValue(
      makeStatus(QueryExecutionStatus.ERROR, {
        message: { type: 'SyntaxError', details: 'Invalid syntax', reason: 'Parse error' },
      })
    );
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs | bad query' });

    expect(result).toEqual({
      success: false,
      executed: false,
      query: 'source=logs | bad query',
      message: 'Query execution failed: SyntaxError: Invalid syntax',
      error: 'SyntaxError: Invalid syntax',
    });
  });

  it('should format error without type when type is missing', async () => {
    mockDispatch.mockResolvedValue(
      makeStatus(QueryExecutionStatus.ERROR, {
        message: { details: 'Something went wrong', reason: 'Unknown' },
      })
    );
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs' });

    expect(result.error).toBe('Something went wrong');
    expect(result.message).toBe('Query execution failed: Something went wrong');
  });

  it('should use fallback error message when error.message is missing', async () => {
    // @ts-expect-error TS2554 TODO(ts-upgrade): fixme
    mockDispatch.mockResolvedValue(makeStatus(QueryExecutionStatus.ERROR));
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Query execution failed');
  });

  it('should not execute query and only update editor when autoExecute is false', async () => {
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs | head 10', autoExecute: false });

    expect(mockLoadQueryActionCreator).not.toHaveBeenCalled();
    expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith('source=logs | head 10');
    expect(result).toEqual({
      success: true,
      executed: false,
      query: 'source=logs | head 10',
      timeRange: undefined,
      message: 'Query updated.',
    });
  });

  it('should update time range and include it in response when from/to provided', async () => {
    // @ts-expect-error TS2554 TODO(ts-upgrade): fixme
    mockDispatch.mockResolvedValue(makeStatus(QueryExecutionStatus.READY));
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs', from: 'now-1h', to: 'now' });

    expect(mockSetTime).toHaveBeenCalledWith({ from: 'now-1h', to: 'now' });
    expect(result.timeRange).toEqual({ from: 'now-1h', to: 'now' });
    expect(result.message).toContain('Time range set to now-1h - now');
  });

  it('should include time range message in no-results response', async () => {
    // @ts-expect-error TS2554 TODO(ts-upgrade): fixme
    mockDispatch.mockResolvedValue(makeStatus(QueryExecutionStatus.NO_RESULTS));
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs', from: 'now-7d', to: 'now' });

    expect(result.message).toBe(
      'Query executed successfully but returned no results. Time range set to now-7d - now.'
    );
  });

  it('should not set time range when only from is provided', async () => {
    const handler = renderAndGetHandler();

    await handler({ query: 'source=logs', from: 'now-1h' });

    expect(mockSetTime).not.toHaveBeenCalled();
  });

  it('should catch unexpected errors thrown outside of query execution', async () => {
    // This simulates a truly unexpected error (e.g. services unavailable before dispatch)
    mockLoadQueryActionCreator.mockImplementation(() => {
      throw new Error('Unexpected setup error');
    });
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs' });

    expect(result).toEqual({
      success: false,
      error: 'Unexpected setup error',
      query: 'source=logs',
    });
  });

  it('should handle non-Error thrown values', async () => {
    mockLoadQueryActionCreator.mockImplementation(() => {
      throw 'string error'; // eslint-disable-line no-throw-literal
    });
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs' });

    expect(result).toEqual({
      success: false,
      error: 'Unknown error',
      query: 'source=logs',
    });
  });

  it('should pass services and setEditorTextWithQuery to loadQueryActionCreator', async () => {
    const handler = renderAndGetHandler();

    await handler({ query: 'source=logs' });

    expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.anything() }),
      mockSetEditorTextWithQuery,
      'source=logs'
    );
  });

  it('should return failure when query is still LOADING (e.g., user navigated away)', async () => {
    // @ts-expect-error TS2554 TODO(ts-upgrade): fixme
    mockDispatch.mockResolvedValue(makeStatus(QueryExecutionStatus.LOADING));
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs | head 10' });

    expect(result).toEqual({
      success: false,
      executed: false,
      query: 'source=logs | head 10',
      message: 'Query execution was cancelled or did not complete. Status: loading',
      error: 'Query execution was interrupted',
    });
  });

  it('should return failure when query status is UNINITIALIZED', async () => {
    // @ts-expect-error TS2554 TODO(ts-upgrade): fixme
    mockDispatch.mockResolvedValue(makeStatus(QueryExecutionStatus.UNINITIALIZED));
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs' });

    expect(result).toEqual({
      success: false,
      executed: false,
      query: 'source=logs',
      message: 'Query execution was cancelled or did not complete. Status: uninitialized',
      error: 'Query execution was interrupted',
    });
  });
});
