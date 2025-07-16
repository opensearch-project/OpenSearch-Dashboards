/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ErrorPanel } from './error_panel';
import { QueryExecutionStatus } from '../../application/utils/state_management/types';

const createMockStore = (error: any) => {
  const defaultState = {
    queryEditor: {
      overallQueryStatus: {
        status: error ? QueryExecutionStatus.ERROR : QueryExecutionStatus.READY,
        error,
      },
      queryStatusMap: {},
      promptModeIsAvailable: false,
      promptToQueryIsLoading: false,
      editorMode: 'single-query',
    },
  };

  return configureStore({
    reducer: {
      queryEditor: (state = defaultState.queryEditor) => state,
    },
    preloadedState: defaultState,
  });
};

const meta: Meta<typeof ErrorPanel> = {
  title: 'src/plugins/explore/public/components/error_panel',
  component: ErrorPanel,
  decorators: [
    (Story, { args }) => {
      const store = createMockStore((args as any).error);
      return (
        <Provider store={store}>
          <Story />
        </Provider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays error information from query execution with title, details, and type.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorPanel>;

export const QuerySyntaxError: Story = {
  args: {
    error: {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: 'Query syntax error: unexpected token at line 5, column 12',
        reason: 'Invalid query syntax',
        type: 'parsing_exception',
      },
      originalErrorMessage: 'Original error message',
    },
  },
};
