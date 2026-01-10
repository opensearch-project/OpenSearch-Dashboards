/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { callAgentActionCreator } from './call_agent';
import {
  setPromptToQueryIsLoading,
  setLastExecutedPrompt,
  setLastExecutedTranslatedQuery,
} from '../../../../slices';
import { runQueryActionCreator } from '../../run_query';
import { ExploreServices } from '../../../../../../../types';
import { AppDispatch } from '../../../../store';
import {
  AgentError,
  ProhibitedQueryError,
} from '../../../../../../../components/query_panel/utils/error';

// Mock the dependencies
jest.mock('../../../../slices', () => ({
  setPromptToQueryIsLoading: jest.fn(),
  setLastExecutedPrompt: jest.fn(),
  setLastExecutedTranslatedQuery: jest.fn(),
}));

jest.mock('../../run_query', () => ({
  runQueryActionCreator: jest.fn(),
}));

const mockSetPromptToQueryIsLoading = setPromptToQueryIsLoading as jest.MockedFunction<
  typeof setPromptToQueryIsLoading
>;
const mockSetLastExecutedPrompt = setLastExecutedPrompt as jest.MockedFunction<
  typeof setLastExecutedPrompt
>;
const mockSetLastExecutedTranslatedQuery = setLastExecutedTranslatedQuery as jest.MockedFunction<
  typeof setLastExecutedTranslatedQuery
>;
const mockRunQueryActionCreator = runQueryActionCreator as jest.MockedFunction<
  typeof runQueryActionCreator
>;

describe('callAgentActionCreator', () => {
  let mockServices: ExploreServices;
  let mockDispatch: jest.MockedFunction<AppDispatch>;
  const testEditorText = 'What are the top 10 users?';

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();

    mockServices = ({
      data: {
        query: {
          queryString: {
            getQuery: jest.fn().mockReturnValue({
              dataset: {
                title: 'test-index',
                dataSource: { id: 'test-datasource' },
                timeFieldName: 'timestamp',
              },
            }),
          },
          timefilter: {
            timefilter: {
              setTime: jest.fn(),
            },
          },
        },
      },
      http: {
        post: jest.fn(),
      },
      notifications: {
        toasts: {
          addWarning: jest.fn(),
          addError: jest.fn(),
        },
      },
    } as unknown) as ExploreServices;

    // Mock return values for action creators
    mockSetPromptToQueryIsLoading.mockReturnValue({
      type: 'queryEditor/setPromptToQueryIsLoading',
      payload: true,
    });
    mockSetLastExecutedPrompt.mockReturnValue({
      type: 'queryEditor/setLastExecutedPrompt',
      payload: 'test prompt',
    });
    mockSetLastExecutedTranslatedQuery.mockReturnValue({
      type: 'queryEditor/setLastExecutedTranslatedQuery',
      payload: 'test query',
    });
    mockRunQueryActionCreator.mockReturnValue(jest.fn());
  });

  describe('successful agent call', () => {
    const mockResponse = {
      query: '| where user_count > 0 | head 10',
      timeRange: {
        from: '2025-04-25 03:05:42',
        to: '2025-05-02 03:05:42',
      },
    };

    beforeEach(() => {
      (mockServices.http.post as jest.Mock).mockResolvedValue(mockResponse);
    });

    it('should call the agent API with correct parameters', async () => {
      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      const callArgs = (mockServices.http.post as jest.Mock).mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);

      expect(callArgs[0]).toBe('/api/enhancements/assist/generate');
      expect(bodyData.question).toBe(testEditorText);
      expect(bodyData.index).toBe('test-index');
      expect(bodyData.language).toBe('PPL');
      expect(bodyData.dataSourceId).toBe('test-datasource');
      expect(typeof bodyData.currentTime).toBe('string');
      expect(bodyData.timeField).toBe('timestamp');
    });

    it('should dispatch runQueryActionCreator with the response query', async () => {
      const mockRunAction = jest.fn();
      mockRunQueryActionCreator.mockReturnValue(mockRunAction);

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, mockResponse.query);
      expect(mockDispatch).toHaveBeenCalledWith(mockRunAction);
    });

    it('should set time range when provided in response', async () => {
      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockServices.data.query.timefilter.timefilter.setTime).toHaveBeenCalledWith({
        from: moment(mockResponse.timeRange.from, 'YYYY-MM-DD HH:mm:ss').toISOString(),
        to: moment(mockResponse.timeRange.to, 'YYYY-MM-DD HH:mm:ss').toISOString(),
      });
    });

    it('should set last executed translated query', async () => {
      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        mockSetLastExecutedTranslatedQuery(mockResponse.query)
      );
    });

    it('should not set time range when not provided in response', async () => {
      (mockServices.http.post as jest.Mock).mockResolvedValue({
        query: '| where user_count > 0 | head 10',
      });

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockServices.data.query.timefilter.timefilter.setTime).not.toHaveBeenCalled();
    });

    it('should set last executed prompt after successful API call', async () => {
      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockDispatch).toHaveBeenCalledWith(mockSetLastExecutedPrompt(testEditorText));
    });

    it('should set loading state to true before API call and false after completion', async () => {
      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockDispatch).toHaveBeenCalledWith(mockSetPromptToQueryIsLoading(true));
      expect(mockDispatch).toHaveBeenCalledWith(mockSetPromptToQueryIsLoading(false));
    });
  });

  describe('validation errors', () => {
    it('should show warning when editor text is empty', async () => {
      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: '',
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockServices.notifications.toasts.addWarning).toHaveBeenCalledWith({
        title: 'Missing prompt',
        text: 'Enter a question to automatically generate a query',
        id: 'missing-prompt-warning',
      });
      expect(mockServices.http.post).not.toHaveBeenCalled();
    });

    it('should allow whitespace editor text and make API call', async () => {
      const whitespaceText = '   \n\t  ';
      (mockServices.http.post as jest.Mock).mockResolvedValue({ query: 'test query' });

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: whitespaceText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      // The actual code only checks !editorText.length, so whitespace text with length > 0 will not trigger warning
      const callArgs = (mockServices.http.post as jest.Mock).mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);

      expect(callArgs[0]).toBe('/api/enhancements/assist/generate');
      expect(bodyData.question).toBe(whitespaceText);
      expect(bodyData.index).toBe('test-index');
      expect(bodyData.language).toBe('PPL');
      expect(bodyData.dataSourceId).toBe('test-datasource');
      expect(typeof bodyData.currentTime).toBe('string');
      expect(bodyData.timeField).toBe('timestamp');
    });

    it('should show warning when dataset is missing', async () => {
      (mockServices.data.query.queryString.getQuery as jest.Mock).mockReturnValue({
        dataset: null,
      });

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockServices.notifications.toasts.addWarning).toHaveBeenCalledWith({
        title: 'Select a dataset to ask a question',
        id: 'missing-dataset-warning',
      });
      expect(mockServices.http.post).not.toHaveBeenCalled();
    });

    it('should show warning when dataset is undefined', async () => {
      (mockServices.data.query.queryString.getQuery as jest.Mock).mockReturnValue({});

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockServices.notifications.toasts.addWarning).toHaveBeenCalledWith({
        title: 'Select a dataset to ask a question',
        id: 'missing-dataset-warning',
      });
    });
  });

  describe('error handling', () => {
    it('should handle ProhibitedQueryError', async () => {
      const prohibitedError = new ProhibitedQueryError('Query not allowed');
      (mockServices.http.post as jest.Mock).mockRejectedValue(prohibitedError);

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockServices.notifications.toasts.addError).toHaveBeenCalledWith(prohibitedError, {
        id: 'prohibited-query-error',
        title: 'I am unable to respond to this query. Try another question',
      });
    });

    it('should handle AgentError', async () => {
      const agentError = new AgentError({
        error: {
          reason: 'Agent processing failed',
          details: 'Agent failed',
          type: 'AGENT_ERROR',
        },
        status: 500,
      });
      (mockServices.http.post as jest.Mock).mockRejectedValue(agentError);

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockServices.notifications.toasts.addError).toHaveBeenCalledWith(agentError, {
        id: 'agent-error',
        title: 'I am unable to respond to this query. Try another question',
      });
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Network error');
      (mockServices.http.post as jest.Mock).mockRejectedValue(genericError);

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockServices.notifications.toasts.addError).toHaveBeenCalledWith(genericError, {
        id: 'miscellaneous-prompt-error',
        title: 'Failed to generate results',
      });
    });

    it('should not run query when error occurs', async () => {
      const error = new Error('API error');
      (mockServices.http.post as jest.Mock).mockRejectedValue(error);

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockRunQueryActionCreator).not.toHaveBeenCalled();
    });

    it('should set loading to false even when error occurs', async () => {
      const error = new Error('API error');
      (mockServices.http.post as jest.Mock).mockRejectedValue(error);

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockDispatch).toHaveBeenCalledWith(mockSetPromptToQueryIsLoading(true));
      expect(mockDispatch).toHaveBeenCalledWith(mockSetPromptToQueryIsLoading(false));
    });

    it('should not set last executed data when error occurs', async () => {
      const error = new Error('API error');
      (mockServices.http.post as jest.Mock).mockRejectedValue(error);

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(mockSetLastExecutedPrompt).not.toHaveBeenCalled();
      expect(mockSetLastExecutedTranslatedQuery).not.toHaveBeenCalled();
    });
  });

  describe('dataset variations', () => {
    beforeEach(() => {
      (mockServices.http.post as jest.Mock).mockResolvedValue({ query: 'test query' });
    });

    it('should use PromQL language for PROMETHEUS dataset type', async () => {
      (mockServices.data.query.queryString.getQuery as jest.Mock).mockReturnValue({
        dataset: {
          title: 'prometheus-metrics',
          type: 'PROMETHEUS',
          dataSource: { id: 'prometheus-datasource' },
          timeFieldName: 'timestamp',
        },
      });

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      const callArgs = (mockServices.http.post as jest.Mock).mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);

      expect(callArgs[0]).toBe('/api/enhancements/assist/generate');
      expect(bodyData.question).toBe(testEditorText);
      expect(bodyData.index).toBe('prometheus-metrics');
      expect(bodyData.language).toBe('PROMQL');
      expect(bodyData.dataSourceId).toBe('prometheus-datasource');
    });

    it('should handle dataset without dataSource', async () => {
      (mockServices.data.query.queryString.getQuery as jest.Mock).mockReturnValue({
        dataset: {
          title: 'test-index',
        },
      });

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      const callArgs = (mockServices.http.post as jest.Mock).mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);

      expect(callArgs[0]).toBe('/api/enhancements/assist/generate');
      expect(bodyData.question).toBe(testEditorText);
      expect(bodyData.index).toBe('test-index');
      expect(bodyData.language).toBe('PPL');
      expect(typeof bodyData.currentTime).toBe('string');
      expect(bodyData).not.toHaveProperty('dataSourceId');
      expect(bodyData).not.toHaveProperty('timeField');
    });

    it('should handle dataset with empty dataSource', async () => {
      (mockServices.data.query.queryString.getQuery as jest.Mock).mockReturnValue({
        dataset: {
          title: 'test-index',
          dataSource: {},
        },
      });

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      const callArgs = (mockServices.http.post as jest.Mock).mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);

      expect(callArgs[0]).toBe('/api/enhancements/assist/generate');
      expect(bodyData.question).toBe(testEditorText);
      expect(bodyData.index).toBe('test-index');
      expect(bodyData.language).toBe('PPL');
      expect(typeof bodyData.currentTime).toBe('string');
      expect(bodyData).not.toHaveProperty('dataSourceId');
      expect(bodyData).not.toHaveProperty('timeField');
    });
  });

  describe('execution flow', () => {
    it('should execute steps in correct order on success', async () => {
      const calls: string[] = [];

      let dispatchCallCount = 0;
      mockDispatch.mockImplementation((action: any) => {
        dispatchCallCount++;
        if (action.type === 'queryEditor/setPromptToQueryIsLoading') {
          calls.push('setPromptToQueryIsLoading');
        } else if (action.type === 'queryEditor/setLastExecutedPrompt') {
          calls.push('setLastExecutedPrompt');
        } else if (action.type === 'queryEditor/setLastExecutedTranslatedQuery') {
          calls.push('setLastExecutedTranslatedQuery');
        } else if (typeof action === 'function') {
          // This is the runQuery thunk
          calls.push('runQuery');
        }
      });

      (mockServices.data.query.timefilter.timefilter.setTime as jest.Mock).mockImplementation(
        () => {
          calls.push('setTime');
        }
      );

      (mockServices.http.post as jest.Mock).mockResolvedValue({
        query: 'test query',
        timeRange: { from: 'now-1d', to: 'now' },
      });

      const thunk = callAgentActionCreator({
        services: mockServices,
        editorText: testEditorText,
      });

      await thunk(mockDispatch, jest.fn(), undefined);

      expect(calls).toEqual([
        'setPromptToQueryIsLoading',
        'setTime',
        'runQuery',
        'setLastExecutedTranslatedQuery',
        'setLastExecutedPrompt',
        'setPromptToQueryIsLoading',
      ]);
      expect(dispatchCallCount).toBe(7);
    });
  });
});
