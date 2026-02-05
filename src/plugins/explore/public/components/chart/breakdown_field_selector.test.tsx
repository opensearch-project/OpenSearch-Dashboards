/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BreakdownFieldSelector } from './breakdown_field_selector';
import {
  legacyReducer,
  uiReducer,
  queryReducer,
  queryEditorReducer,
  resultsReducer,
} from '../../application/utils/state_management/slices';
import { ExploreServices } from '../../types';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';

jest.mock('../../application/context/dataset_context/dataset_context', () => ({
  useDatasetContext: jest.fn(() => ({
    dataset: {
      fields: {
        getAll: jest.fn(() => [
          { name: 'field1', displayName: 'Field 1', type: 'string', scripted: false },
          { name: 'field2', displayName: 'Field 2', type: 'string', scripted: false },
          { name: 'numericField', displayName: 'Numeric Field', type: 'number', scripted: false },
          { name: '_id', displayName: '_id', type: 'string', scripted: false },
        ]),
      },
      metaFields: ['_id', '_index'],
    },
    isLoading: false,
  })),
}));

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  executeHistogramQuery: jest.fn(() => ({ type: 'mock/executeHistogramQuery' })),
  defaultPrepareQueryString: jest.fn((query) => `${query.language}:${query.query}`),
  prepareHistogramCacheKey: jest.fn((query, withBreakdown) =>
    withBreakdown
      ? `histogram:breakdown:${query.language}:${query.query}`
      : `histogram:${query.language}:${query.query}`
  ),
}));

describe('BreakdownFieldSelector', () => {
  const mockServices = ({
    uiSettings: {
      get: jest.fn(),
    },
  } as unknown) as ExploreServices;

  const createMockStore = (breakdownField?: string, queryStatusMap = {}) => {
    return configureStore({
      reducer: {
        legacy: legacyReducer,
        ui: uiReducer,
        query: queryReducer,
        queryEditor: queryEditorReducer,
        results: resultsReducer,
      },
      preloadedState: {
        legacy: {
          savedSearch: undefined,
          savedQuery: undefined,
          columns: [],
          sort: [],
          interval: '1h',
          isDirty: false,
          lineCount: undefined,
        },
        ui: {
          activeTabId: 'logs',
          showHistogram: true,
        },
        query: {
          query: 'source=logs | head 10',
          language: 'PPL',
          dataset: {
            id: 'test-dataset',
            title: 'test-dataset',
            type: 'INDEX_PATTERN',
          },
        },
        // @ts-expect-error TS2741 TODO(ts-error): fixme
        queryEditor: {
          breakdownField,
          queryStatusMap,
          overallQueryStatus: {
            status: 'uninitialized' as any,
            elapsedMs: undefined,
            startTime: undefined,
            error: undefined,
          },
          promptModeIsAvailable: false,
          editorMode: 'single-query' as any,
          lastExecutedPrompt: '',
          promptToQueryIsLoading: false,
          lastExecutedTranslatedQuery: '',
          summaryAgentIsAvailable: false,
          queryExecutionButtonStatus: 'REFRESH',
          isQueryEditorDirty: false,
        },
        results: {},
      },
    });
  };

  const renderComponent = (breakdownField?: string, queryStatusMap = {}) => {
    const store = createMockStore(breakdownField, queryStatusMap);
    return render(
      <Provider store={store}>
        <BreakdownFieldSelector services={mockServices} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the breakdown field selector', () => {
    renderComponent();
    expect(screen.getByTestId('histogramBreakdownFieldSelector')).toBeInTheDocument();
    expect(screen.getByText('Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Select a field')).toBeInTheDocument();
  });

  it('renders with no fields selected initially', () => {
    renderComponent();
    const comboBox = screen.getByTestId('comboBoxSearchInput');
    expect(comboBox).toHaveValue('');
  });

  it('filters out non-string fields, scripted fields, and meta fields', () => {
    renderComponent();

    const input = screen.getByTestId('comboBoxSearchInput');
    fireEvent.click(input);

    expect(screen.getByText('Field 1')).toBeInTheDocument();
    expect(screen.getByText('Field 2')).toBeInTheDocument();

    expect(screen.queryByText('Numeric Field')).not.toBeInTheDocument();
    expect(screen.queryByText('_id')).not.toBeInTheDocument();
  });

  it('displays selected field when breakdownField is set', () => {
    renderComponent('field1');

    expect(screen.getByText('Field 1')).toBeInTheDocument();
  });

  it('dispatches actions when a field is selected', () => {
    const store = createMockStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <BreakdownFieldSelector services={mockServices} />
      </Provider>
    );

    const input = screen.getByTestId('comboBoxSearchInput');
    fireEvent.click(input);

    const field1Option = screen.getByText('Field 1');
    fireEvent.click(field1Option);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'queryEditor/setBreakdownField',
        payload: 'field1',
      })
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'results/clearResultsByKey' })
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'queryEditor/clearQueryStatusMapByKey' })
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'mock/executeHistogramQuery' })
    );
  });

  it('dispatches actions when selection is cleared', () => {
    const store = createMockStore('field1');
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <BreakdownFieldSelector services={mockServices} />
      </Provider>
    );

    const clearButton = screen.getByTestId('comboBoxClearButton');
    fireEvent.click(clearButton);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'queryEditor/setBreakdownField',
        payload: undefined,
      })
    );
  });

  it('displays error icon when breakdown query has error and standard query does not', () => {
    const queryStatusMap = {
      'histogram:breakdown:PPL:source=logs | head 10': {
        status: 'error',
        error: {
          message: {
            details: 'Breakdown query failed with error',
          },
        },
      },
      'histogram:PPL:source=logs | head 10': {
        status: 'success',
      },
    };

    renderComponent('field1', queryStatusMap);

    const container = screen.getByTestId('histogramBreakdownFieldSelector');
    const errorIcon = container.querySelector('[data-euiicon-type="alert"]');
    expect(errorIcon).toBeInTheDocument();
  });

  it('does not display error icon when standard query also has error', () => {
    const queryStatusMap = {
      'histogram:breakdown:PPL:source=logs | head 10': {
        status: 'error',
        error: {
          message: {
            details: 'Breakdown query failed',
          },
        },
      },
      'histogram:PPL:source=logs | head 10': {
        status: 'error',
        error: {
          message: {
            details: 'Standard query failed',
          },
        },
      },
    };

    renderComponent('field1', queryStatusMap);

    expect(screen.queryByLabelText(/Breakdown query failed/i)).not.toBeInTheDocument();
  });

  it('does not display error icon when no breakdown field is selected', () => {
    const queryStatusMap = {
      'histogram:PPL:source=logs | head 10': {
        status: 'success',
      },
    };

    renderComponent(undefined, queryStatusMap);

    const container = screen.getByTestId('histogramBreakdownFieldSelector');
    const errorIcon = container.querySelector('[data-euiicon-type="alert"]');
    expect(errorIcon).not.toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    (useDatasetContext as jest.MockedFunction<typeof useDatasetContext>).mockReturnValueOnce({
      dataset: {
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        fields: {
          getAll: jest.fn(() => []),
        },
        metaFields: [],
      },
      isLoading: true,
    });

    renderComponent();

    const comboBox = screen.getByTestId('histogramBreakdownFieldSelector');
    expect(comboBox).toBeInTheDocument();
  });

  it('renders with no options when no string fields are available', () => {
    (useDatasetContext as jest.MockedFunction<typeof useDatasetContext>).mockReturnValueOnce({
      dataset: {
        fields: {
          // @ts-expect-error TS2322 TODO(ts-error): fixme
          getAll: jest.fn(() => [
            { name: 'numericField', displayName: 'Numeric Field', type: 'number', scripted: false },
          ]),
        },
        metaFields: [],
      },
      isLoading: false,
    });

    renderComponent();

    const input = screen.getByTestId('comboBoxSearchInput');
    fireEvent.click(input);

    // default empty message from component
    expect(screen.getByText("There aren't any options available")).toBeInTheDocument();
  });
});
