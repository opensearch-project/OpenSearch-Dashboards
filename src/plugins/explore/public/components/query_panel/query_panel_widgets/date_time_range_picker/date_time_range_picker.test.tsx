/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DateTimeRangePicker } from './date_time_range_picker';

// Mock dependencies
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('@elastic/eui', () => ({
  EuiSuperDatePicker: jest.fn((props) => (
    <div data-test-subj={props['data-test-subj'] || 'mocked-super-date-picker'}>
      <button
        onClick={() =>
          props.onTimeChange?.({ start: 'now-15m', end: 'now', isQuickSelection: true })
        }
        data-test-subj="time-change-button"
      >
        Change Time
      </button>
      <button onClick={() => props.onRefresh?.()} data-test-subj="refresh-button">
        Refresh
      </button>
      <button
        onClick={() => props.onRefreshChange?.({ isPaused: false, refreshInterval: 5000 })}
        data-test-subj="refresh-change-button"
      >
        Change Refresh
      </button>
    </div>
  )),
}));

jest.mock('../../../../../../data/public', () => ({
  UI_SETTINGS: {
    TIMEPICKER_QUICK_RANGES: 'timepicker:quickRanges',
  },
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/actions/query_editor', () => ({
  runQueryActionCreator: jest.fn(),
}));

jest.mock('../../utils', () => ({
  useTimeFilter: jest.fn(),
}));

import { useDispatch } from 'react-redux';
import { EuiSuperDatePicker } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { runQueryActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { useTimeFilter } from '../../utils';
import { UI_SETTINGS } from '../../../../../../data/public';

const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockEuiSuperDatePicker = (EuiSuperDatePicker as unknown) as jest.Mock;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockRunQueryActionCreator = runQueryActionCreator as jest.MockedFunction<
  typeof runQueryActionCreator
>;
const mockUseTimeFilter = useTimeFilter as jest.MockedFunction<typeof useTimeFilter>;

describe('DateTimeRangePicker', () => {
  let mockDispatch: jest.Mock;
  let mockServices: any;
  let mockTimeFilter: any;
  let mockHandleTimeChange: jest.Mock;
  let mockHandleRefreshChange: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockHandleTimeChange = jest.fn();
    mockHandleRefreshChange = jest.fn();

    mockTimeFilter = {
      getTime: jest.fn().mockReturnValue({
        from: 'now-15m',
        to: 'now',
      }),
      getRefreshInterval: jest.fn().mockReturnValue({
        pause: false,
        value: 10000,
      }),
    };

    mockServices = {
      uiSettings: {
        get: jest.fn().mockImplementation((setting) => {
          if (setting === UI_SETTINGS.TIMEPICKER_QUICK_RANGES) {
            return [
              { from: 'now-15m', to: 'now', display: 'Last 15 minutes' },
              { from: 'now-1h', to: 'now', display: 'Last 1 hour' },
              { from: 'now-24h', to: 'now', display: 'Last 24 hours' },
            ];
          }
          if (setting === 'dateFormat') {
            return 'MMM D, YYYY @ HH:mm:ss.SSS';
          }
          return undefined;
        }),
      },
    };

    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseOpenSearchDashboards.mockReturnValue({ services: mockServices } as any);
    mockUseTimeFilter.mockReturnValue({
      timeFilter: mockTimeFilter,
      handleTimeChange: mockHandleTimeChange,
      handleRefreshChange: mockHandleRefreshChange,
    });
    mockRunQueryActionCreator.mockReturnValue({ type: 'RUN_QUERY' } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderDateTimeRangePicker = () => {
    const store = configureStore({
      reducer: () => ({}),
    });

    return render(
      <Provider store={store}>
        <DateTimeRangePicker />
      </Provider>
    );
  };

  it('should render EuiSuperDatePicker with correct props', () => {
    renderDateTimeRangePicker();

    expect(mockEuiSuperDatePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        start: 'now-15m',
        end: 'now',
        isPaused: false,
        refreshInterval: 10000,
        onTimeChange: mockHandleTimeChange,
        onRefresh: expect.any(Function),
        onRefreshChange: mockHandleRefreshChange,
        showUpdateButton: false,
        commonlyUsedRanges: [
          { start: 'now-15m', end: 'now', label: 'Last 15 minutes' },
          { start: 'now-1h', end: 'now', label: 'Last 1 hour' },
          { start: 'now-24h', end: 'now', label: 'Last 24 hours' },
        ],
        dateFormat: 'MMM D, YYYY @ HH:mm:ss.SSS',
        compressed: true,
        'data-test-subj': 'exploreDateTimeRangePicker',
      }),
      {}
    );
  });

  it('should get time range from timeFilter', () => {
    renderDateTimeRangePicker();

    expect(mockTimeFilter.getTime).toHaveBeenCalled();
    expect(mockEuiSuperDatePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        start: 'now-15m',
        end: 'now',
      }),
      {}
    );
  });

  it('should get refresh interval from timeFilter', () => {
    renderDateTimeRangePicker();

    expect(mockTimeFilter.getRefreshInterval).toHaveBeenCalled();
    expect(mockEuiSuperDatePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        isPaused: false,
        refreshInterval: 10000,
      }),
      {}
    );
  });

  it('should handle paused refresh interval', () => {
    mockTimeFilter.getRefreshInterval.mockReturnValue({
      pause: true,
      value: 0,
    });

    renderDateTimeRangePicker();

    expect(mockEuiSuperDatePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        isPaused: true,
        refreshInterval: 0,
      }),
      {}
    );
  });

  it('should pass handleTimeChange to onTimeChange prop', () => {
    renderDateTimeRangePicker();

    const timeChangeButton = screen.getByTestId('time-change-button');
    fireEvent.click(timeChangeButton);

    expect(mockHandleTimeChange).toHaveBeenCalledWith({
      start: 'now-15m',
      end: 'now',
      isQuickSelection: true,
    });
  });

  it('should pass handleRefreshChange to onRefreshChange prop', () => {
    renderDateTimeRangePicker();

    const refreshChangeButton = screen.getByTestId('refresh-change-button');
    fireEvent.click(refreshChangeButton);

    expect(mockHandleRefreshChange).toHaveBeenCalledWith({
      isPaused: false,
      refreshInterval: 5000,
    });
  });

  it('should dispatch runQueryActionCreator on refresh', () => {
    renderDateTimeRangePicker();

    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.click(refreshButton);

    expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RUN_QUERY' });
  });

  it('should get commonly used ranges from uiSettings', () => {
    renderDateTimeRangePicker();

    expect(mockServices.uiSettings.get).toHaveBeenCalledWith(UI_SETTINGS.TIMEPICKER_QUICK_RANGES);
    expect(mockEuiSuperDatePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        commonlyUsedRanges: [
          { start: 'now-15m', end: 'now', label: 'Last 15 minutes' },
          { start: 'now-1h', end: 'now', label: 'Last 1 hour' },
          { start: 'now-24h', end: 'now', label: 'Last 24 hours' },
        ],
      }),
      {}
    );
  });

  it('should get date format from uiSettings', () => {
    renderDateTimeRangePicker();

    expect(mockServices.uiSettings.get).toHaveBeenCalledWith('dateFormat');
    expect(mockEuiSuperDatePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFormat: 'MMM D, YYYY @ HH:mm:ss.SSS',
      }),
      {}
    );
  });

  it('should handle empty commonly used ranges', () => {
    mockServices.uiSettings.get.mockImplementation((setting: string) => {
      if (setting === UI_SETTINGS.TIMEPICKER_QUICK_RANGES) {
        return [];
      }
      if (setting === 'dateFormat') {
        return 'MMM D, YYYY @ HH:mm:ss.SSS';
      }
      return undefined;
    });

    renderDateTimeRangePicker();

    expect(mockEuiSuperDatePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        commonlyUsedRanges: [],
      }),
      {}
    );
  });

  it('should handle commonly used ranges with different formats', () => {
    mockServices.uiSettings.get.mockImplementation((setting: string) => {
      if (setting === UI_SETTINGS.TIMEPICKER_QUICK_RANGES) {
        return [
          { from: 'now-5m', to: 'now', display: 'Last 5 minutes' },
          { from: 'now-30m', to: 'now', display: 'Last 30 minutes' },
        ];
      }
      if (setting === 'dateFormat') {
        return 'YYYY-MM-DD HH:mm:ss';
      }
      return undefined;
    });

    renderDateTimeRangePicker();

    expect(mockEuiSuperDatePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        commonlyUsedRanges: [
          { start: 'now-5m', end: 'now', label: 'Last 5 minutes' },
          { start: 'now-30m', end: 'now', label: 'Last 30 minutes' },
        ],
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
      }),
      {}
    );
  });

  it('should have correct static props', () => {
    renderDateTimeRangePicker();

    expect(mockEuiSuperDatePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        showUpdateButton: false,
        compressed: true,
        'data-test-subj': 'exploreDateTimeRangePicker',
      }),
      {}
    );
  });
});
