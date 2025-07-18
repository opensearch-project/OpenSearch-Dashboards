/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { IntlProvider } from 'react-intl';
import { QueryPanelError } from './query_panel_error';
import { ResultStatus } from '../../../../../../data/public';

describe('QueryPanelError', () => {
  const createMockStore = (overrides = {}) => {
    const defaultState = {
      queryEditor: {
        overallQueryStatus: {
          status: ResultStatus.ERROR,
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

  const renderQueryPanelError = (storeOverrides = {}) => {
    const store = createMockStore(storeOverrides);
    return render(
      <Provider store={store}>
        <IntlProvider locale="en">
          <QueryPanelError />
        </IntlProvider>
      </Provider>
    );
  };

  describe('Component Rendering', () => {
    it('should render error button when status is ERROR and error exists', () => {
      renderQueryPanelError();

      const errorButton = screen.getByTestId('exploreQueryPanelError');
      expect(errorButton).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should not render when status is not ERROR', () => {
      const storeOverrides = {
        queryEditor: {
          overallQueryStatus: {
            status: ResultStatus.READY,
            error: undefined,
          },
          queryStatusMap: {},
          promptModeIsAvailable: false,
          promptToQueryIsLoading: false,
          editorMode: 'single-query',
        },
      };

      const { container } = renderQueryPanelError(storeOverrides);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when error is undefined', () => {
      const storeOverrides = {
        queryEditor: {
          overallQueryStatus: {
            status: ResultStatus.ERROR,
            error: undefined,
          },
          queryStatusMap: {},
          promptModeIsAvailable: false,
          promptToQueryIsLoading: false,
          editorMode: 'single-query',
        },
      };

      const { container } = renderQueryPanelError(storeOverrides);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Popover Functionality', () => {
    it('should open popover when button is clicked', () => {
      renderQueryPanelError();

      const errorButton = screen.getByTestId('exploreQueryPanelError');
      fireEvent.click(errorButton);

      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('Invalid query syntax')).toBeInTheDocument();
    });

    it('should display error reason in popover body', () => {
      renderQueryPanelError();

      const errorButton = screen.getByTestId('exploreQueryPanelError');
      fireEvent.click(errorButton);

      expect(screen.getByText('Invalid query syntax')).toBeInTheDocument();
    });
  });
});
