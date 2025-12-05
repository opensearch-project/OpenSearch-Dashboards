/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ErrorGuard } from './error_guard';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';

const mockTabDefinition: TabDefinition = {
  id: 'mock-tab',
  label: 'Mock Tab',
  component: () => <div>Mock Tab Content</div>,
  flavor: ['logs'] as any,
  supportedLanguages: ['SQL'],
};

const createMockStore = (error: any) => {
  const cacheKey = 'mock-cache-key';
  const defaultState = {
    query: {
      query: 'SELECT * FROM logs',
      language: 'SQL',
    },
    queryEditor: {
      queryStatusMap: {
        [cacheKey]: {
          status: error ? QueryExecutionStatus.ERROR : QueryExecutionStatus.READY,
          error,
        },
      },
    },
  };

  return configureStore({
    reducer: {
      query: (state = defaultState.query) => state,
      queryEditor: (state = defaultState.queryEditor) => state,
    },
    preloadedState: defaultState,
  });
};

const meta: Meta<typeof ErrorGuard> = {
  title: 'src/plugins/explore/public/components/tabs/error_guard',
  component: ErrorGuard,
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
          'A guard component that displays error information for individual tabs or renders children when no error exists.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorGuard>;

export const WithError: Story = {
  args: {
    registryTab: mockTabDefinition,
    children: <div>This content is hidden when there&apos;s an error</div>,
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

export const WithoutError: Story = {
  args: {
    registryTab: mockTabDefinition,
    children: (
      <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '4px' }}>
        This is the tab content that shows when there&apos;s no error
      </div>
    ),
    error: null,
  },
};

export const NetworkError: Story = {
  args: {
    registryTab: mockTabDefinition,
    children: <div>Hidden content</div>,
    error: {
      statusCode: 500,
      error: 'Internal Server Error',
      message: {
        details: 'Connection timeout: Unable to reach OpenSearch cluster at localhost:9200',
        reason: 'Network connection failed',
        type: 'connection_exception',
      },
      originalErrorMessage: 'Network error occurred',
    },
  },
};
