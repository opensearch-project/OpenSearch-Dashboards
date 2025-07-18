/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ErrorPanel } from './error_panel';
import { QueryExecutionStatus } from '../../application/utils/state_management/types';

// Mock the ErrorCodeBlock component
jest.mock('./error_code_block', () => ({
  ErrorCodeBlock: ({ title, text }: { title: string; text: string }) => (
    <div data-test-subj="error-code-block">
      <div data-test-subj="error-code-block-title">{title}</div>
      <div data-test-subj="error-code-block-text">{text}</div>
    </div>
  ),
}));

describe('ErrorPanel', () => {
  const createMockStore = (overrides = {}) => {
    const defaultState = {
      queryEditor: {
        overallQueryStatus: {
          status: QueryExecutionStatus.ERROR,
          error: {
            statusCode: 400,
            error: 'Bad Request',
            message: {
              details: 'Query syntax error: unexpected token at line 5',
              reason: 'Invalid query syntax',
              type: 'parsing_exception',
            },
            originalErrorMessage: 'Original error message',
          },
        },
        queryStatusMap: {},
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        editorMode: 'single-query',
      },
      ...overrides,
    };

    return configureStore({
      reducer: {
        queryEditor: (state = defaultState.queryEditor) => state,
      },
      preloadedState: defaultState,
    });
  };

  const renderErrorPanel = (storeOverrides = {}) => {
    const store = createMockStore(storeOverrides);
    return render(
      <Provider store={store}>
        <ErrorPanel />
      </Provider>
    );
  };

  describe('Component Rendering', () => {
    it('should render error panel with all components when error exists', () => {
      renderErrorPanel();

      // Check for main container
      expect(screen.getByTestId('exploreErrorPanel')).toBeInTheDocument();

      // Check for error title (reason)
      expect(screen.getByText('Invalid query syntax')).toBeInTheDocument();

      // Check for error details block
      const errorBlocks = screen.getAllByTestId('error-code-block');
      expect(errorBlocks).toHaveLength(2); // Details and Type blocks

      // Check for details content
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(
        screen.getByText('Query syntax error: unexpected token at line 5')
      ).toBeInTheDocument();

      // Check for type content
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('parsing_exception')).toBeInTheDocument();
    });

    it('should render with default title when error reason is not available', () => {
      const storeOverrides = {
        queryEditor: {
          overallQueryStatus: {
            status: QueryExecutionStatus.ERROR,
            error: {
              statusCode: 500,
              error: 'Internal Server Error',
              message: {
                details: 'Server encountered an error',
                reason: '',
                type: 'server_error',
              },
              originalErrorMessage: 'Original error message',
            },
          },
          queryStatusMap: {},
          promptModeIsAvailable: false,
          promptToQueryIsLoading: false,
          editorMode: 'single-query',
        },
      };

      renderErrorPanel(storeOverrides);

      // Should show default error title
      expect(screen.getByText('An error occurred while executing the query')).toBeInTheDocument();
    });

    it('should not render type block when error type is not available', () => {
      const storeOverrides = {
        queryEditor: {
          overallQueryStatus: {
            status: QueryExecutionStatus.ERROR,
            error: {
              statusCode: 400,
              error: 'Bad Request',
              message: {
                details: 'Query syntax error',
                reason: 'Invalid query',
                type: undefined,
              },
              originalErrorMessage: 'Original error message',
            },
          },
          queryStatusMap: {},
          promptModeIsAvailable: false,
          promptToQueryIsLoading: false,
          editorMode: 'single-query',
        },
      };

      renderErrorPanel(storeOverrides);

      // Should only have details block, not type block
      const errorBlocks = screen.getAllByTestId('error-code-block');
      expect(errorBlocks).toHaveLength(1);

      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.queryByText('Type')).not.toBeInTheDocument();
    });

    it('should not render when no error exists', () => {
      const storeOverrides = {
        queryEditor: {
          overallQueryStatus: {
            status: QueryExecutionStatus.READY,
            error: undefined,
          },
          queryStatusMap: {},
          promptModeIsAvailable: false,
          promptToQueryIsLoading: false,
          editorMode: 'single-query',
        },
      };

      const { container } = renderErrorPanel(storeOverrides);
      expect(container.firstChild).toBeNull();
    });
  });
});
