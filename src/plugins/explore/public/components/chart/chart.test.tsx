/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DiscoverChart } from './chart';
import {
  legacyReducer,
  uiReducer,
  queryReducer,
  queryEditorReducer,
  resultsReducer,
  tabReducer,
} from '../../application/utils/state_management/slices';
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { DataPublicPluginStart } from '../../../../data/public';
import { ExploreServices } from '../../types';

// Mock the query actions
jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  executeQueries: jest.fn(() => ({ type: 'mock/executeQueries' })),
  executeHistogramQuery: jest.fn(() => ({ type: 'mock/executeHistogramQuery' })),
  defaultPrepareQueryString: jest.fn((query) => `${query.language}:${query.query}`),
}));

// Mock the TimechartHeader component
jest.mock('./timechart_header', () => ({
  TimechartHeader: (props: { onChangeInterval: (interval: string) => void }) => (
    <div data-test-subj="mockTimechartHeader">
      <button onClick={() => props.onChangeInterval('1h')}>Change Interval</button>
    </div>
  ),
}));

// Mock the DiscoverHistogram component
jest.mock('./histogram/histogram', () => ({
  DiscoverHistogram: () => <div data-test-subj="mockDiscoverHistogram">Mock Histogram</div>,
}));

describe('DiscoverChart', () => {
  const mockConfig = {
    get: jest.fn().mockReturnValue('MMM D, YYYY @ HH:mm:ss.SSS'),
    get$: jest.fn(),
    getAll: jest.fn(),
    getDefault: jest.fn(),
    getUserProvidedWithScope: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    overrideLocalDefault: jest.fn(),
    isDeclared: jest.fn(),
    isDefault: jest.fn(),
    isCustom: jest.fn(),
    isOverridden: jest.fn(),
    getUpdate$: jest.fn(),
    getSaved$: jest.fn(),
    getUpdateErrors$: jest.fn(),
  } as IUiSettingsClient;

  const mockData = ({
    query: {
      timefilter: {
        timefilter: {
          getTime: jest.fn().mockReturnValue({
            from: 'now-15m',
            to: 'now',
          }),
          setTime: jest.fn(),
        },
      },
    },
    search: {
      aggs: {
        intervalOptions: [
          { text: 'Auto', value: 'auto' },
          { text: '1 hour', value: '1h' },
        ],
      },
    },
  } as unknown) as DataPublicPluginStart;

  const mockServices = {
    uiSettings: mockConfig,
  } as ExploreServices;

  const mockStore = configureStore({
    reducer: {
      legacy: legacyReducer,
      ui: uiReducer,
      query: queryReducer,
      queryEditor: queryEditorReducer,
      results: resultsReducer,
      tab: tabReducer,
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
        showFilterPanel: true,
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
      queryEditor: {
        queryStatusMap: {},
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
      },
      results: {},
      tab: {
        logs: {},
        visualizations: {
          styleOptions: {
            showTitle: true,
            title: '',
            fontSize: 60,
            useColor: false,
            colorSchema: 'blues' as any,
          },
          chartType: undefined,
          axesMapping: {},
        },
      },
    },
  });

  const defaultProps = {
    config: mockConfig,
    data: mockData,
    services: mockServices,
    showHistogram: true,
  };

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={mockStore}>
        <DiscoverChart {...defaultProps} {...props} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chart component with header', () => {
    renderComponent();

    expect(screen.getByTestId('dscChartWrapper')).toBeInTheDocument();
    expect(screen.getByTestId('dscChartChartheader')).toBeInTheDocument();
    expect(screen.getByTestId('dscChartTimechartHeader')).toBeInTheDocument();
    expect(screen.getByTestId('mockTimechartHeader')).toBeInTheDocument();
  });

  it('renders the histogram when showHistogram is true and chartData is provided', () => {
    const chartData = { xAxisOrderedValues: [], yAxisLabel: 'Count' };
    renderComponent({ chartData });

    expect(screen.getByTestId('dscTimechart')).toBeInTheDocument();
    expect(screen.getByTestId('discoverChart')).toBeInTheDocument();
    expect(screen.getByTestId('mockDiscoverHistogram')).toBeInTheDocument();
  });

  it('does not render histogram when showHistogram is false', () => {
    const chartData = { xAxisOrderedValues: [], yAxisLabel: 'Count' };
    renderComponent({ chartData, showHistogram: false });

    expect(screen.queryByTestId('dscTimechart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('discoverChart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mockDiscoverHistogram')).not.toBeInTheDocument();
  });

  it('does not render histogram when chartData is not provided', () => {
    renderComponent({ showHistogram: true });

    expect(screen.queryByTestId('dscTimechart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('discoverChart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mockDiscoverHistogram')).not.toBeInTheDocument();
  });

  it('renders toggle button with correct icon when histogram is shown', () => {
    renderComponent();

    const toggleButton = screen.getByTestId('histogramCollapseBtn');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders toggle button with correct icon when histogram is hidden', () => {
    renderComponent({ showHistogram: false });

    const toggleButton = screen.getByTestId('histogramCollapseBtn');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('calls dispatch when toggle button is clicked', () => {
    const dispatchSpy = jest.spyOn(mockStore, 'dispatch');
    renderComponent();

    const toggleButton = screen.getByTestId('histogramCollapseBtn');
    fireEvent.click(toggleButton);

    expect(dispatchSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ui/setShowHistogram' })
    );
  });

  it('calls onChangeInterval when interval is changed', () => {
    const dispatchSpy = jest.spyOn(mockStore, 'dispatch');
    renderComponent();

    const changeIntervalButton = screen.getByText('Change Interval');
    fireEvent.click(changeIntervalButton);

    expect(dispatchSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'legacy/setInterval' })
    );
  });

  it('should handle timefilter update correctly', () => {
    const chartData = { xAxisOrderedValues: [], yAxisLabel: 'Count' };

    renderComponent({ chartData });

    // The timefilterUpdateHandler is passed to DiscoverHistogram
    // We can verify the component renders without errors
    expect(screen.getByTestId('mockDiscoverHistogram')).toBeInTheDocument();

    // Verify that the data.query.timefilter.timefilter.setTime method exists
    expect(mockData.query.timefilter.timefilter.setTime).toBeDefined();
  });

  it('should use correct time range format', () => {
    renderComponent();

    // Verify that getTime is called to get the time range
    expect(mockData.query.timefilter.timefilter.getTime).toHaveBeenCalled();
  });

  it('should dispatch multiple actions when interval changes', () => {
    const dispatchSpy = jest.spyOn(mockStore, 'dispatch');
    renderComponent();

    const changeIntervalButton = screen.getByText('Change Interval');
    fireEvent.click(changeIntervalButton);

    // Should dispatch setInterval, clearResultsByKey, clearQueryStatusMapByKey, and executeHistogramQuery
    expect(dispatchSpy).toHaveBeenCalledTimes(4);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'legacy/setInterval' })
    );
  });
});
