/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import React from 'react';
import { rootReducer } from '../../application/utils/state_management/store';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../common';
import { EditorMode, QueryExecutionStatus } from '../../application/utils/state_management/types';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { EditorContextProvider } from '../../application/context';
import { DatasetProvider } from '../../application/context';

const mockServices = {
  uiSettings: {
    get: (key: string, defaultValue?: any) => {
      switch (key) {
        case 'timepicker:quickRanges':
          return [
            { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
            { from: 'now-30m', to: 'now', display: 'Last 30 minutes' },
            { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
            { from: 'now-4h', to: 'now', display: 'Last 4 hours' },
            { from: 'now-12h', to: 'now', display: 'Last 12 hours' },
            { from: 'now-24h', to: 'now', display: 'Last 24 hours' },
            { from: 'now-7d', to: 'now', display: 'Last 7 days' },
            { from: 'now-30d', to: 'now', display: 'Last 30 days' },
            { from: 'now-90d', to: 'now', display: 'Last 90 days' },
            { from: 'now-1y', to: 'now', display: 'Last 1 year' },
          ];
        case 'dateFormat':
          return 'MMM D, YYYY @ HH:mm:ss.SSS';
        default:
          return defaultValue;
      }
    },
    get$: (_key: string, defaultValue: any) => ({
      subscribe: (cb: any) => {
        cb(defaultValue);
        return { unsubscribe: () => {} };
      },
    }),
  },
  data: {
    query: {
      queryString: {
        getQuery: () => ({ query: '', language: 'SQL' }),
        setQuery: () => {},
        addToQueryHistory: () => {},
        getQueryHistory: () => [
          { query: 'SELECT * FROM logs', language: 'SQL' },
          { query: 'source = table | head 10', language: 'PPL' },
        ],
        clearQueryHistory: () => {},
        changeQueryHistory: () => {},
        getDatasetService: () => ({
          cacheDataset: () => Promise.resolve(),
        }),
      },
      timefilter: {
        timefilter: {
          getTime: () => ({ from: 'now-15m', to: 'now' }),
          setTime: () => {},
          getRefreshInterval: () => ({ pause: false, value: 10000 }),
          setRefreshInterval: () => {},
        },
      },
    },
    search: {
      tabifyAggResponse: () => ({}),
    },
    indexPatterns: {
      get: () =>
        Promise.resolve({
          id: 'mock-index-pattern',
          title: 'mock-logs-*',
          timeFieldName: '@timestamp',
          fields: [],
        }),
    },
  },
  indexPatterns: {
    get: () =>
      Promise.resolve({
        id: 'mock-index-pattern',
        title: 'mock-logs-*',
        timeFieldName: '@timestamp',
        fields: [],
      }),
  },
  savedObjects: {
    client: {
      get: () => Promise.resolve({}),
      find: () => Promise.resolve({ savedObjects: [] }),
    },
  },
  notifications: {
    toasts: {
      addSuccess: () => {},
      addError: () => {},
      addWarning: () => {},
    },
  },
  core: {
    http: {
      get: () => Promise.resolve({}),
      post: () => Promise.resolve({}),
    },
    notifications: {
      toasts: {
        addSuccess: () => {},
        addError: () => {},
        addWarning: () => {},
      },
    },
  },
  capabilities: {
    explore: {
      show: true,
      save: true,
    },
  },
  chrome: {
    setBreadcrumbs: () => {},
    setHelpExtension: () => {},
  },
  toastNotifications: {
    addSuccess: () => {},
    addError: () => {},
    addWarning: () => {},
  },
  storage: {
    get: () => null,
    set: () => {},
    remove: () => {},
  },
  docLinks: {
    links: {
      noDocumentation: {
        ppl: {
          base: 'https://opensearch.org/docs/latest/search-plugins/sql/ppl/index/',
        },
        sqlPplLimitation: {
          base: 'https://opensearch.org/docs/latest/search-plugins/sql/limitation/',
        },
      },
    },
  },
};

const createMockStore = (editorMode: EditorMode = EditorMode.SingleQuery) => {
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
        showFilterPanel: true,
        showHistogram: true,
      },
      results: {},
      tab: {
        logs: {},
        visualizations: {
          styleOptions: undefined,
          chartType: 'line',
          axesMapping: {},
        },
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
          body: undefined,
        },
        editorMode,
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        lastExecutedPrompt: '',
      },
    },
  });
};

export const StorybookProviders: React.FC<{
  children: React.ReactNode;
  editorMode?: EditorMode;
}> = ({ children, editorMode }) => {
  const store = createMockStore(editorMode);

  return (
    <Provider store={store}>
      <OpenSearchDashboardsContextProvider services={mockServices}>
        <EditorContextProvider>
          <DatasetProvider>{children}</DatasetProvider>
        </EditorContextProvider>
      </OpenSearchDashboardsContextProvider>
    </Provider>
  );
};
