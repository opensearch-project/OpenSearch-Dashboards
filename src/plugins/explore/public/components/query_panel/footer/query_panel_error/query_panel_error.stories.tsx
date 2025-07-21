/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { IntlProvider } from 'react-intl';
import { QueryPanelError } from './query_panel_error';
import { ResultStatus } from '../../../../../../data/public';

// Create a mock store with error state for QueryPanelError
const createErrorStore = () => {
  return configureStore({
    reducer: {
      queryEditor: (
        state = {
          overallQueryStatus: {
            status: ResultStatus.ERROR,
            error: {
              statusCode: 400,
              error: 'Bad Request',
              message: {
                details:
                  'Query syntax error: unexpected token at line 5, column 12. Expected closing bracket but found comma.',
                reason: 'Invalid query syntax',
                type: 'parsing_exception',
              },
              originalErrorMessage: 'Syntax error in query',
            },
          },
          queryStatusMap: {},
          promptModeIsAvailable: false,
          promptToQueryIsLoading: false,
          editorMode: 'single-query',
        }
      ) => state,
    },
  });
};

const meta: Meta<typeof QueryPanelError> = {
  title: 'src/plugins/explore/public/components/query_panel/footer/query_panel_error',
  component: QueryPanelError,
  decorators: [
    (Story) => {
      const store = createErrorStore();
      return (
        <Provider store={store}>
          <IntlProvider locale="en">
            <div style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
              <Story />
            </div>
          </IntlProvider>
        </Provider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays a clickable error button with a popover showing error details when query execution fails.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QueryPanelError>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shows the error button with a popover containing query syntax error details. Click the button to see the error message.',
      },
    },
  },
};
