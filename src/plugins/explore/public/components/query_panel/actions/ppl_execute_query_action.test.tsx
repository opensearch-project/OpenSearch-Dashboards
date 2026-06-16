/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import {
  usePPLExecuteQueryAction,
  EXECUTE_PPL_QUERY_TOOL_DEFINITION,
  registerDisabledPPLExecuteQueryAction,
} from './ppl_execute_query_action';

const mockDispatch = jest.fn();
const mockRegisterAssistantAction = jest.fn();
const mockSetEditorTextWithQuery = jest.fn();
const mockLoadQueryActionCreator = jest.fn();
const mockSetTime = jest.fn();
const mockGetState = jest.fn();
const mockPrepareQueryForLanguage = jest.fn();

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
      store: { getState: mockGetState },
      contextProvider: {
        actions: { registerAssistantAction: mockRegisterAssistantAction },
      },
    },
  }),
}));

jest.mock('../../../application/utils/state_management/actions/query_editor/load_query', () => ({
  loadQueryActionCreator: (...args: any[]) => mockLoadQueryActionCreator(...args),
}));

jest.mock('../../../application/utils/languages', () => ({
  prepareQueryForLanguage: (...args: any[]) => mockPrepareQueryForLanguage(...args),
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

const TEST_CACHE_KEY = 'source=logs | head 10';

describe('usePPLExecuteQueryAction', () => {
  const makeQueryState = (status: string, error?: any) =>
    ({
      query: { language: 'PPL', query: 'source=logs | head 10' },
      queryEditor: {
        queryStatusMap: {
          [TEST_CACHE_KEY]: { status, error },
        },
      },
    } as any);

  beforeEach(() => {
    mockDispatch.mockClear();
    mockSetEditorTextWithQuery.mockClear();
    mockLoadQueryActionCreator.mockClear();
    mockSetTime.mockClear();
    mockRegisterAssistantAction.mockClear();
    mockGetState.mockClear();
    mockPrepareQueryForLanguage.mockClear();

    mockDispatch.mockResolvedValue(undefined);
    mockLoadQueryActionCreator.mockReturnValue({ type: 'LOAD_QUERY' });
    mockPrepareQueryForLanguage.mockReturnValue({ query: TEST_CACHE_KEY });
    mockGetState.mockReturnValue(makeQueryState(QueryExecutionStatus.READY));
  });

  const renderAndGetHandler = () => {
    act(() => {
      renderHook(() => usePPLExecuteQueryAction(mockSetEditorTextWithQuery));
    });
    expect(mockRegisterAssistantAction).toHaveBeenCalled();
    return mockRegisterAssistantAction.mock.calls[
      mockRegisterAssistantAction.mock.calls.length - 1
    ][0].handler;
  };

  it('should register assistant action with correct name and required parameters', () => {
    renderAndGetHandler();
    const latestCall =
      mockRegisterAssistantAction.mock.calls[mockRegisterAssistantAction.mock.calls.length - 1][0];
    expect(latestCall.name).toBe('execute_ppl_query');
    expect(latestCall.parameters.required).toContain('query');
    expect(latestCall.handler).toBeInstanceOf(Function);
  });

  it('should execute query and return success on READY status', async () => {
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

  it('should use prepareQueryForLanguage to derive cache key from state', async () => {
    const handler = renderAndGetHandler();
    const stateQuery = { language: 'PPL', query: 'source=logs | head 10' };
    mockGetState.mockReturnValue({
      query: stateQuery,
      queryEditor: { queryStatusMap: { [TEST_CACHE_KEY]: { status: QueryExecutionStatus.READY } } },
    } as any);

    await handler({ query: 'source=logs | head 10' });

    expect(mockPrepareQueryForLanguage).toHaveBeenCalledWith({
      ...stateQuery,
      query: 'source=logs | head 10',
    });
  });

  it('should return success with resultsCount 0 on NO_RESULTS status', async () => {
    mockGetState.mockReturnValue(makeQueryState(QueryExecutionStatus.NO_RESULTS));
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

  it('should return failure on ERROR status with full error message', async () => {
    mockGetState.mockReturnValue(
      makeQueryState(QueryExecutionStatus.ERROR, {
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
    mockGetState.mockReturnValue(
      makeQueryState(QueryExecutionStatus.ERROR, {
        message: { details: 'Something went wrong', reason: 'Unknown' },
      })
    );
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs' });

    expect(result.error).toBe('Something went wrong');
    expect(result.message).toBe('Query execution failed: Something went wrong');
  });

  it('should use fallback error message when error.message is missing', async () => {
    mockGetState.mockReturnValue(makeQueryState(QueryExecutionStatus.ERROR));
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
    const handler = renderAndGetHandler();

    const result = await handler({ query: 'source=logs', from: 'now-1h', to: 'now' });

    expect(mockSetTime).toHaveBeenCalledWith({ from: 'now-1h', to: 'now' });
    expect(result.timeRange).toEqual({ from: 'now-1h', to: 'now' });
    expect(result.message).toContain('Time range set to now-1h - now');
  });

  it('should include time range message in no-results response', async () => {
    mockGetState.mockReturnValue(makeQueryState(QueryExecutionStatus.NO_RESULTS));
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

  it('should return failure when query is still LOADING', async () => {
    mockGetState.mockReturnValue(makeQueryState(QueryExecutionStatus.LOADING));
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
    mockGetState.mockReturnValue(makeQueryState(QueryExecutionStatus.UNINITIALIZED));
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

  it('should replace action with disabled version after unmount', () => {
    const { unmount } = renderHook(() => usePPLExecuteQueryAction(mockSetEditorTextWithQuery));

    expect(mockRegisterAssistantAction).not.toHaveBeenCalledWith(
      expect.objectContaining({
        available: 'disabled',
      })
    );

    unmount();

    expect(mockRegisterAssistantAction).toHaveBeenCalledWith(
      expect.objectContaining({
        available: 'disabled',
      })
    );
  });
});

describe('EXECUTE_PPL_QUERY_TOOL_DEFINITION', () => {
  it('should have the correct tool name', () => {
    expect(EXECUTE_PPL_QUERY_TOOL_DEFINITION.name).toBe('execute_ppl_query');
  });

  it('should have a description', () => {
    expect(EXECUTE_PPL_QUERY_TOOL_DEFINITION.description).toContain('PPL query');
    expect(EXECUTE_PPL_QUERY_TOOL_DEFINITION.description).toContain('time range');
  });

  it('should have correct parameter properties', () => {
    const { parameters } = EXECUTE_PPL_QUERY_TOOL_DEFINITION;

    expect(parameters.type).toBe('object');
    expect(parameters.properties).toHaveProperty('query');
    expect(parameters.properties).toHaveProperty('autoExecute');
    expect(parameters.properties).toHaveProperty('description');
    expect(parameters.properties).toHaveProperty('from');
    expect(parameters.properties).toHaveProperty('to');
    expect(parameters.required).toEqual(['query']);
  });

  it('should have query parameter as string type', () => {
    expect(EXECUTE_PPL_QUERY_TOOL_DEFINITION.parameters.properties.query.type).toBe('string');
  });

  it('should have autoExecute parameter as boolean type', () => {
    expect(EXECUTE_PPL_QUERY_TOOL_DEFINITION.parameters.properties.autoExecute.type).toBe(
      'boolean'
    );
  });

  it('should have time range parameters with descriptions', () => {
    const fromParam = EXECUTE_PPL_QUERY_TOOL_DEFINITION.parameters.properties.from;
    const toParam = EXECUTE_PPL_QUERY_TOOL_DEFINITION.parameters.properties.to;

    expect(fromParam.type).toBe('string');
    expect(fromParam.description).toContain('Start time');
    expect(toParam.type).toBe('string');
    expect(toParam.description).toContain('End time');
  });
});

describe('registerDisabledPPLExecuteQueryAction', () => {
  it('should not throw if registerAction is undefined', () => {
    expect(() => registerDisabledPPLExecuteQueryAction(undefined as any)).not.toThrow();
  });

  it('should call registerAction with correct structure', () => {
    const mockRegisterAction = jest.fn();

    registerDisabledPPLExecuteQueryAction(mockRegisterAction);

    expect(mockRegisterAction).toHaveBeenCalledTimes(1);
    const registeredAction = mockRegisterAction.mock.calls[0][0];

    expect(registeredAction.name).toBe('execute_ppl_query');
    expect(registeredAction.available).toBe('disabled');
    expect(registeredAction.handler).toBeDefined();
    expect(typeof registeredAction.handler).toBe('function');
  });

  it('should register action with same parameters as enabled version', () => {
    const mockRegisterAction = jest.fn();

    registerDisabledPPLExecuteQueryAction(mockRegisterAction);

    const registeredAction = mockRegisterAction.mock.calls[0][0];
    expect(registeredAction.description).toBe(EXECUTE_PPL_QUERY_TOOL_DEFINITION.description);
    expect(registeredAction.parameters).toEqual(EXECUTE_PPL_QUERY_TOOL_DEFINITION.parameters);
  });

  it('should return error when handler is called', async () => {
    const mockRegisterAction = jest.fn();

    registerDisabledPPLExecuteQueryAction(mockRegisterAction);

    const registeredAction = mockRegisterAction.mock.calls[0][0];
    const result = await registeredAction.handler({ query: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('STOP');
    expect(result.error).toContain('Tool not available');
    expect(result.message).toContain('IMPORTANT');
    expect(result.message).toContain('Do not attempt to use any more tools');
    expect(result.stop_tool_execution).toBe(true);
    expect(result.context_lost).toBe(true);
  });

  it('should provide explicit instruction to stop tool execution', async () => {
    const mockRegisterAction = jest.fn();

    registerDisabledPPLExecuteQueryAction(mockRegisterAction);

    const registeredAction = mockRegisterAction.mock.calls[0][0];
    const result = await registeredAction.handler({ query: 'test' });

    // Should tell agent to stop using tools and respond directly
    expect(result.message).toContain('Do not attempt to use any more tools');
    expect(result.message).toContain('respond directly to the user');
    expect(result.message).toContain('Logs');
    expect(result.message).toContain('Traces');
    expect(result.message).toContain('Metrics');

    // Should have flags for programmatic handling
    expect(result.stop_tool_execution).toBe(true);
    expect(result.context_lost).toBe(true);
  });
});
