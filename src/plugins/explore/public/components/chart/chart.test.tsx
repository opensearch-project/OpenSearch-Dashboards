/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DiscoverChart } from './chart';
import { legacyReducer } from '../../application/utils/state_management/slices';
import { uiReducer } from '../../application/utils/state_management/slices/ui/ui_slice';
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { DataPublicPluginStart } from '../../../../data/public';
import { ExploreServices } from '../../types';

// Mock the TimechartHeader component
jest.mock('./timechart_header', () => ({
  TimechartHeader: ({ onChangeInterval }: { onChangeInterval: (interval: string) => void }) => (
    <div data-test-subj="mockTimechartHeader">
      <button onClick={() => onChangeInterval('1h')}>Change Interval</button>
    </div>
  ),
}));

// Mock the DiscoverHistogram component
jest.mock('./histogram/histogram', () => ({
  DiscoverHistogram: () => <div data-test-subj="mockDiscoverHistogram">Mock Histogram</div>,
}));

// Mock the executeQueries action
jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  executeQueries: jest.fn().mockReturnValue({ type: 'mock/executeQueries' }),
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
            from: '2023-01-01T00:00:00.000Z',
            to: '2023-01-02T00:00:00.000Z',
          }),
          setTime: jest.fn(),
        },
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
    },
    preloadedState: {
      legacy: {
        interval: '1h',
        columns: [],
        sort: [],
      },
      ui: {
        activeTabId: 'logs',
        showDatasetFields: true,
        prompt: '',
        showHistogram: true,
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
    expect(screen.getByTestId('mockTimechartHeader')).toBeInTheDocument();
  });

  it('renders the histogram when showHistogram is true and chartData is provided', () => {
    const chartData = { xAxisOrderedValues: [], yAxisLabel: 'Count' };
    renderComponent({ chartData });

    expect(screen.getByTestId('dscTimechart')).toBeInTheDocument();
    expect(screen.getByTestId('mockDiscoverHistogram')).toBeInTheDocument();
  });

  it('does not render histogram when showHistogram is false', () => {
    const chartData = { xAxisOrderedValues: [], yAxisLabel: 'Count' };
    renderComponent({ chartData, showHistogram: false });

    expect(screen.queryByTestId('dscTimechart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mockDiscoverHistogram')).not.toBeInTheDocument();
  });

  it('does not render histogram when chartData is not provided', () => {
    renderComponent({ showHistogram: true });

    expect(screen.queryByTestId('dscTimechart')).not.toBeInTheDocument();
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
  });
});
