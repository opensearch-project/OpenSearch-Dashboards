/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { usePPLExecuteQueryAction } from './ppl_execute_query_action';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { loadQueryActionCreator } from '../../../application/utils/state_management/actions/query_editor/load_query';
import { useDispatch } from 'react-redux';

// Mock dependencies
const mockUseAssistantAction = jest.fn();

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../../../application/utils/state_management/actions/query_editor/load_query', () => ({
  loadQueryActionCreator: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

describe('usePPLExecuteQueryAction', () => {
  let mockSetEditorTextWithQuery: jest.Mock;
  let mockServices: any;
  let store: any;
  let mockUseOpenSearchDashboards: jest.Mock;
  let mockLoadQueryActionCreator: jest.Mock;
  let mockUseDispatch: jest.Mock;

  beforeEach(() => {
    // Get the mocked functions
    mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.Mock;
    mockLoadQueryActionCreator = loadQueryActionCreator as jest.Mock;
    mockUseDispatch = useDispatch as jest.Mock;

    // Mock services with contextProvider dependency injection
    mockServices = {
      data: { query: { queryString: { getQuery: jest.fn() } } },
      notifications: { toasts: { addSuccess: jest.fn(), addError: jest.fn() } },
      contextProvider: {
        hooks: {
          useAssistantAction: mockUseAssistantAction,
        },
      },
    };

    // Setup mocks
    mockUseOpenSearchDashboards.mockReturnValue({ services: mockServices });
    mockLoadQueryActionCreator.mockReturnValue({ type: 'LOAD_QUERY' });
    mockSetEditorTextWithQuery = jest.fn();
    mockUseDispatch.mockReturnValue(jest.fn());
    mockUseAssistantAction.mockClear();

    // Create mock store
    store = configureStore({
      reducer: {
        query: (state = {}, action: any) => state,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('should register assistant action with correct configuration', () => {
    renderHook(() => usePPLExecuteQueryAction(mockSetEditorTextWithQuery));

    expect(mockUseAssistantAction).toHaveBeenCalledWith({
      name: 'execute_ppl_query',
      description: 'Update the query bar with a PPL query and optionally execute it',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The PPL query to set in the query bar',
          },
          autoExecute: {
            type: 'boolean',
            description: 'Whether to automatically execute the query (default: true)',
          },
          description: {
            type: 'string',
            description: 'Optional description of what the query does',
          },
        },
        required: ['query'],
      },
      handler: expect.any(Function),
      render: expect.any(Function),
    });
  });

  describe('handler function', () => {
    let handler: (args: any) => Promise<any>;

    beforeEach(() => {
      renderHook(() => usePPLExecuteQueryAction(mockSetEditorTextWithQuery));
      // Get the handler from the mock call
      if (mockUseAssistantAction.mock.calls.length > 0) {
        handler = mockUseAssistantAction.mock.calls[0][0].handler;
      }
    });

    it('should execute query by default (autoExecute: true)', async () => {
      const args = { query: 'source=logs | head 10' };

      const result = await handler(args);

      expect(mockUseDispatch()).toHaveBeenCalledWith({ type: 'LOAD_QUERY' });
      expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
        mockServices,
        mockSetEditorTextWithQuery,
        'source=logs | head 10'
      );
      expect(result).toEqual({
        success: true,
        executed: true,
        query: 'source=logs | head 10',
        message: 'Query updated and executed',
      });
    });

    it('should execute query when autoExecute is explicitly true', async () => {
      const args = { query: 'source=logs | head 10', autoExecute: true };

      const result = await handler(args);

      expect(mockUseDispatch()).toHaveBeenCalledWith({ type: 'LOAD_QUERY' });
      expect(result).toEqual({
        success: true,
        executed: true,
        query: 'source=logs | head 10',
        message: 'Query updated and executed',
      });
    });

    it('should only update editor when autoExecute is false', async () => {
      const args = { query: 'source=logs | head 10', autoExecute: false };

      const result = await handler(args);

      expect(mockUseDispatch()).not.toHaveBeenCalled();
      expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith('source=logs | head 10');
      expect(result).toEqual({
        success: true,
        executed: false,
        query: 'source=logs | head 10',
        message: 'Query updated',
      });
    });

    it('should handle errors gracefully', async () => {
      const args = { query: 'source=logs | head 10' };
      const error = new Error('Test error');

      // Mock loadQueryActionCreator to throw an error
      mockLoadQueryActionCreator.mockImplementation(() => {
        throw error;
      });

      const result = await handler(args);

      expect(result).toEqual({
        success: false,
        error: 'Test error',
        query: 'source=logs | head 10',
      });

      // Reset the mock
      mockLoadQueryActionCreator.mockReturnValue({ type: 'LOAD_QUERY' });
    });

    it('should handle non-Error exceptions', async () => {
      const args = { query: 'source=logs | head 10' };

      // Mock loadQueryActionCreator to throw a non-Error (string)
      mockLoadQueryActionCreator.mockImplementation(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'String error';
      });

      const result = await handler(args);

      expect(result).toEqual({
        success: false,
        error: 'Unknown error',
        query: 'source=logs | head 10',
      });

      // Reset the mock
      mockLoadQueryActionCreator.mockReturnValue({ type: 'LOAD_QUERY' });
    });
  });

  describe('render function', () => {
    let renderFunction: (props: any) => React.ReactElement | null;

    beforeEach(() => {
      renderHook(() => usePPLExecuteQueryAction(mockSetEditorTextWithQuery));
      // Get the render function from the mock call
      if (mockUseAssistantAction.mock.calls.length > 0) {
        renderFunction = mockUseAssistantAction.mock.calls[0][0].render;
      }
    });

    it('should return null when args is not provided', () => {
      const result = renderFunction({ status: 'complete', args: null, result: null });
      expect(result).toBeNull();
    });

    it('should render executing status', () => {
      const props = {
        status: 'executing',
        args: { query: 'source=logs | head 10' },
        result: null,
      };

      const component = renderFunction(props);
      renderWithProvider(component!);

      expect(screen.getByText('⟳')).toBeInTheDocument();
      expect(screen.getByText('Updating query...')).toBeInTheDocument();
      expect(screen.getByText('source=logs | head 10')).toBeInTheDocument();
    });

    it('should render complete status with execution', () => {
      const props = {
        status: 'complete',
        args: { query: 'source=logs | head 10' },
        result: { success: true, executed: true, message: 'Query updated and executed' },
      };

      const component = renderFunction(props);
      renderWithProvider(component!);

      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('Query updated and executed')).toBeInTheDocument();
      expect(screen.getByText('source=logs | head 10')).toBeInTheDocument();
    });

    it('should render complete status without execution', () => {
      const props = {
        status: 'complete',
        args: { query: 'source=logs | head 10' },
        result: { success: true, executed: false, message: 'Query updated' },
      };

      const component = renderFunction(props);
      renderWithProvider(component!);

      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('Query updated')).toBeInTheDocument();
    });

    it('should render failed status', () => {
      const props = {
        status: 'failed',
        args: { query: 'source=logs | head 10' },
        result: { success: false, error: 'Test error' },
      };

      const component = renderFunction(props);
      renderWithProvider(component!);

      expect(screen.getByText('✗')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should render failed status with default message when no error', () => {
      const props = {
        status: 'failed',
        args: { query: 'source=logs | head 10' },
        result: null,
      };

      const component = renderFunction(props);
      renderWithProvider(component!);

      expect(screen.getByText('✗')).toBeInTheDocument();
      expect(screen.getByText('Failed to update query')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      const props = {
        status: 'complete',
        args: {
          query: 'source=logs | head 10',
          description: 'Get the first 10 log entries',
        },
        result: { success: true, executed: true, message: 'Query updated and executed' },
      };

      const component = renderFunction(props);
      renderWithProvider(component!);

      expect(screen.getByText('Get the first 10 log entries')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      const props = {
        status: 'complete',
        args: { query: 'source=logs | head 10' },
        result: { success: true, executed: true, message: 'Query updated and executed' },
      };

      const component = renderFunction(props);
      renderWithProvider(component!);

      expect(screen.queryByText('Get the first 10 log entries')).not.toBeInTheDocument();
    });

    describe('status colors and icons', () => {
      it('should use danger color for failed status', () => {
        const props = {
          status: 'failed',
          args: { query: 'source=logs | head 10' },
          result: null,
        };

        const component = renderFunction(props);
        renderWithProvider(component!);

        const panel = screen.getByText('✗').closest('.euiPanel');
        expect(panel).toHaveClass('euiPanel--danger');
      });

      it('should use success color for completed execution', () => {
        const props = {
          status: 'complete',
          args: { query: 'source=logs | head 10' },
          result: { success: true, executed: true, message: 'Query updated and executed' },
        };

        const component = renderFunction(props);
        renderWithProvider(component!);

        const panel = screen.getByText('✓').closest('.euiPanel');
        expect(panel).toHaveClass('euiPanel--success');
      });

      it('should use primary color for completed without execution', () => {
        const props = {
          status: 'complete',
          args: { query: 'source=logs | head 10' },
          result: { success: true, executed: false, message: 'Query updated' },
        };

        const component = renderFunction(props);
        renderWithProvider(component!);

        const panel = screen.getByText('✓').closest('.euiPanel');
        expect(panel).toHaveClass('euiPanel--primary');
      });

      it('should use subdued color for other statuses', () => {
        const props = {
          status: 'idle',
          args: { query: 'source=logs | head 10' },
          result: null,
        };

        const component = renderFunction(props);
        renderWithProvider(component!);

        const panel = screen.getByText('✓').closest('.euiPanel');
        expect(panel).toHaveClass('euiPanel--subdued');
      });
    });
  });

  describe('integration', () => {
    it('should work with all dependencies', () => {
      expect(() => {
        renderHook(() => usePPLExecuteQueryAction(mockSetEditorTextWithQuery));
      }).not.toThrow();

      expect(mockUseAssistantAction).toHaveBeenCalled();
      expect(mockUseOpenSearchDashboards).toHaveBeenCalled();
    });
  });
});
