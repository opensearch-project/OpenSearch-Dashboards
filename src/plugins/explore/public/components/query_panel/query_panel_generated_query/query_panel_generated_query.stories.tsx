/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryPanelGeneratedQuery } from './query_panel_generated_query';
import { StorybookProviders } from '../mock_provider.mocks';
import { rootReducer } from '../../../application/utils/state_management/store';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../common';
import {
  EditorMode,
  QueryExecutionStatus,
} from '../../../application/utils/state_management/types';

const meta: Meta<typeof QueryPanelGeneratedQuery> = {
  title: 'QueryPanel/QueryPanelGeneratedQuery',
  component: QueryPanelGeneratedQuery,
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Component that displays the last executed translated query with an edit button.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QueryPanelGeneratedQuery>;

// Custom store creator with different query states
const createStoreWithQuery = (lastExecutedTranslatedQuery: string = '') => {
  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      query: {
        query: 'SELECT * FROM logs',
        language: EXPLORE_DEFAULT_LANGUAGE,
        dataset: undefined,
      },
      ui: {
        activeTabId: 'logs',
        showHistogram: true,
      },
      results: {},
      tab: {
        logs: {},
      },
      legacy: {
        columns: [],
        sort: [],
        interval: 'auto',
      },
      queryEditor: {
        queryStatusMap: {},
        overallQueryStatus: {
          status: QueryExecutionStatus.UNINITIALIZED,
          elapsedMs: undefined,
          startTime: undefined,
          error: undefined,
        },
        editorMode: EditorMode.Query,
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        lastExecutedPrompt: '',
        lastExecutedTranslatedQuery,
        summaryAgentIsAvailable: false,
        queryExecutionButtonStatus: 'REFRESH',
        isQueryEditorDirty: false,
      },
    },
  });
};

// Custom provider for stories with different query states
const CustomStorybookProvider: React.FC<{
  children: React.ReactNode;
  lastExecutedTranslatedQuery?: string;
}> = ({ children, lastExecutedTranslatedQuery = '' }) => {
  const store = createStoreWithQuery(lastExecutedTranslatedQuery);

  return (
    <Provider store={store}>
      <StorybookProviders>{children}</StorybookProviders>
    </Provider>
  );
};

export const WithPPLQuery: Story = {
  decorators: [
    (Story) => (
      <CustomStorybookProvider lastExecutedTranslatedQuery="source = logs | where level = 'ERROR' | sort - timestamp | head 100">
        <Story />
      </CustomStorybookProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows the component with a PPL query that was translated from a user prompt.',
      },
    },
  },
};

export const NoQuery: Story = {
  decorators: [
    (Story) => (
      <CustomStorybookProvider>
        <Story />
      </CustomStorybookProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows that the component renders nothing when there is no translated query.',
      },
    },
  },
};
