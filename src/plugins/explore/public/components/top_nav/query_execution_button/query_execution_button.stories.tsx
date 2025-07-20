/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryExecutionButton, QueryExecutionButtonProps } from './query_execution_button';
import { rootReducer } from '../../../application/utils/state_management/store';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import { isTimeRangeInvalid } from '../utils/validate_time_range';

// Mock the validation function
jest.mock('../utils/validate_time_range', () => ({
  isTimeRangeInvalid: jest.fn(() => false),
}));

const mockIsTimeRangeInvalid = isTimeRangeInvalid as jest.MockedFunction<typeof isTimeRangeInvalid>;

// Mock services for Storybook
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
} as any;

// Create a mock store with customizable state
const createMockStore = (queryEditorOverrides = {}) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      query: {
        query: '',
        language: 'kuery',
        dataset: undefined,
      },
      ui: {
        activeTabId: '',
        showHistogram: true,
      },
      results: {},
      tab: {
        logs: {},
        visualizations: {
          styleOptions: undefined,
          chartType: undefined,
          axesMapping: {},
        },
      },
      legacy: {
        columns: ['_source'],
        sort: [],
        isDirty: false,
        savedQuery: undefined,
        lineCount: undefined,
        interval: 'auto',
        savedSearch: undefined,
      },
      queryEditor: {
        queryStatusMap: {},
        overallQueryStatus: {
          status: QueryExecutionStatus.UNINITIALIZED,
          elapsedMs: undefined,
          startTime: undefined,
        },
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        editorMode: 'query' as any,
        lastExecutedTranslatedQuery: '',
        lastExecutedPrompt: '',
        queryExecutionButtonStatus: 'REFRESH' as const,
        dateRange: undefined,
        ...queryEditorOverrides,
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
        <Provider store={store}>
          <Story />
        </Provider>
      );
    },
  ],
  args: {
    services: mockServices,
    editorText: '',
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
  args: {
    editorText: '',
  },
  decorators: [
    (Story) => {
      const store = createMockStore({
        queryExecutionButtonStatus: 'REFRESH',
      });
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
        story: 'Default state showing "Refresh" when no changes are detected.',
      },
    },
  },
};

export const WithQueryChanges: Story = {
  args: {
    editorText: 'SELECT * FROM logs WHERE level = "ERROR"',
  },
  decorators: [
    (Story) => {
      const store = createMockStore({
        queryExecutionButtonStatus: 'UPDATE',
      });
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
        story: 'Shows "Update" when the query text has changed from the current query.',
      },
    },
  },
};

export const WithDateRangeChanges: Story = {
  args: {
    editorText: '',
  },
  decorators: [
    (Story) => {
      const store = createMockStore({
        queryExecutionButtonStatus: 'UPDATE',
        dateRange: { from: 'now-1h', to: 'now' },
      });
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
        story: 'Shows "Update" when the date range has changed.',
      },
    },
  },
};

export const DisabledWithUpdate: Story = {
  args: {
    editorText: 'SELECT * FROM logs WHERE level = "ERROR"',
  },
  decorators: [
    (Story) => {
      // Mock invalid date range for this story
      mockIsTimeRangeInvalid.mockReturnValue(true);

      const store = createMockStore({
        queryExecutionButtonStatus: 'DISABLED',
        dateRange: { from: 'invalid', to: 'invalid' },
      });

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
        story:
          'Button in disabled state showing "Update" text when there are validation errors but changes are present.',
      },
    },
  },
};

export const DisabledWithRefresh: Story = {
  args: {
    editorText: '',
  },
  decorators: [
    (Story) => {
      // Mock invalid date range for this story
      mockIsTimeRangeInvalid.mockReturnValue(true);

      const store = createMockStore({
        queryExecutionButtonStatus: 'DISABLED',
        dateRange: { from: 'invalid', to: 'invalid' },
      });

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
        story:
          'Button in disabled state showing "Refresh" text when there are validation errors and no changes.',
      },
    },
  },
};

export const WithBothChanges: Story = {
  args: {
    editorText: 'source=logs | where level="ERROR" | head 100',
  },
  decorators: [
    (Story) => {
      const store = createMockStore({
        queryExecutionButtonStatus: 'UPDATE',
        dateRange: { from: 'now-2h', to: 'now' },
      });
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
        story: 'Shows "Update" when both query and date range have changed.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    editorText: 'SELECT * FROM logs',
  },
  decorators: [
    (Story) => {
      const store = createMockStore({
        queryExecutionButtonStatus: 'UPDATE',
      });
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
        story:
          'Interactive example showing how the button responds to changes. The component automatically calculates its status based on query and date range changes.',
      },
    },
  },
};
