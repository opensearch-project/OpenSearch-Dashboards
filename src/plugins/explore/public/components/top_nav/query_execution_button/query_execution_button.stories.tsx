/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { QueryExecutionButton, QueryExecutionButtonProps } from './query_execution_button';
import { rootReducer } from '../../../application/utils/state_management/store';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';

const mockServices = {
  data: {
    query: {
      timefilter: {
        timefilter: {
          getTime: () => ({ from: 'now-15m', to: 'now' }),
        },
      },
      queryString: {
        getQuery: () => ({ query: '', language: 'kuery' }),
      },
    },
  },
  notifications: {
    toasts: {
      addError: () => {},
      addSuccess: () => {},
      addWarning: () => {},
    },
  },
} as any;

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      ui: {} as any,
      results: {} as any,
      tab: {} as any,
      legacy: {} as any,
      query: {} as any,
      queryEditor: {
        queryStatusMap: {},
        overallQueryStatus: {
          status: QueryExecutionStatus.UNINITIALIZED,
          elapsedMs: undefined,
          startTime: undefined,
        },
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        summaryAgentIsAvailable: false,
        editorMode: 'query' as any,
        lastExecutedTranslatedQuery: '',
        lastExecutedPrompt: '',
        queryExecutionButtonStatus: 'REFRESH',
        dateRange: undefined,
        isQueryEditorDirty: false,
        ...initialState,
      },
    },
  });
};

const meta: Meta<QueryExecutionButtonProps> = {
  title: 'src/plugins/explore/public/components/top_nav/query_execution_button',
  component: QueryExecutionButton,
  decorators: [
    (Story) => {
      const store = createMockStore();
      return (
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <Provider store={store}>
            <Story />
          </Provider>
        </OpenSearchDashboardsContextProvider>
      );
    },
  ],
  args: {
    onClick: () => alert('Query executed!'),
  },
  parameters: {
    docs: {
      description: {
        component:
          'Query execution button that automatically calculates and displays its status based on query and date range changes. Shows "Update" when changes are detected, "Refresh" when no changes are present, and can be disabled when validation errors occur.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<QueryExecutionButtonProps>;

export const Default: Story = {
  decorators: [
    (Story) => {
      const store = createMockStore({
        isQueryEditorDirty: false,
        dateRange: undefined,
      });
      return (
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <Provider store={store}>
            <Story />
          </Provider>
        </OpenSearchDashboardsContextProvider>
      );
    },
  ],
};

export const UpdateState: Story = {
  decorators: [
    (Story) => {
      const store = createMockStore({
        isQueryEditorDirty: true,
      });
      return (
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <Provider store={store}>
            <Story />
          </Provider>
        </OpenSearchDashboardsContextProvider>
      );
    },
  ],
};

export const RefreshState: Story = {
  decorators: [
    (Story) => {
      const store = createMockStore({
        isQueryEditorDirty: false,
        dateRange: undefined,
      });
      return (
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <Provider store={store}>
            <Story />
          </Provider>
        </OpenSearchDashboardsContextProvider>
      );
    },
  ],
};

export const DisabledState: Story = {
  decorators: [
    (Story) => {
      const store = createMockStore({
        dateRange: { from: 'invalid', to: 'invalid' },
      });
      return (
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <Provider store={store}>
            <Story />
          </Provider>
        </OpenSearchDashboardsContextProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Shows the button in disabled state when date range validation fails. Note: This story requires mocking the isTimeRangeInvalid function to return true.',
      },
    },
  },
};

export const DateRangeChanged: Story = {
  decorators: [
    (Story) => {
      const store = createMockStore({
        dateRange: { from: 'now-30m', to: 'now' },
        isQueryEditorDirty: false,
      });
      return (
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <Provider store={store}>
            <Story />
          </Provider>
        </OpenSearchDashboardsContextProvider>
      );
    },
  ],
};

export const QueryDirty: Story = {
  decorators: [
    (Story) => {
      const store = createMockStore({
        isQueryEditorDirty: true,
      });
      return (
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <Provider store={store}>
            <Story />
          </Provider>
        </OpenSearchDashboardsContextProvider>
      );
    },
  ],
};

export const BothChanged: Story = {
  decorators: [
    (Story) => {
      const store = createMockStore({
        dateRange: { from: 'now-1h', to: 'now' },
        isQueryEditorDirty: true,
      });
      return (
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <Provider store={store}>
            <Story />
          </Provider>
        </OpenSearchDashboardsContextProvider>
      );
    },
  ],
};
