/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useDataSourceUpdater } from './use_data_source_updater';
import { DEFAULT_DATA_SOURCE_UI_SETTINGS_ID } from '../constants';
import { UiSettingScope } from '../../../../../core/public';

describe('useDataSourceUpdater', () => {
  const mockFetchDataSources = jest.fn();
  const mockUiSettings = {
    set: jest.fn(),
  };
  const mockLoadDefaultDataSourceId = jest.fn();
  const mockNotifications = {
    toasts: {
      addWarning: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set first data source as default when no default exists', async () => {
    const mockDataSources = [{ id: 'ds1' }];
    mockFetchDataSources.mockResolvedValue(mockDataSources);

    const { result } = renderHook(() =>
      useDataSourceUpdater({
        fetchDataSources: mockFetchDataSources,
        defaultDataSourceIdRef: { current: '' },
        uiSettings: mockUiSettings as any,
        loadDefaultDataSourceId: mockLoadDefaultDataSourceId,
        currentWorkspace: null,
        notifications: mockNotifications as any,
      })
    );

    await result.current.handleDataSourceUpdated();

    expect(mockUiSettings.set).toHaveBeenCalledWith(
      DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
      'ds1',
      UiSettingScope.GLOBAL
    );
  });

  it('should not set default when default already exists', async () => {
    const mockDataSources = [{ id: 'ds1' }];
    mockFetchDataSources.mockResolvedValue(mockDataSources);

    const { result } = renderHook(() =>
      useDataSourceUpdater({
        fetchDataSources: mockFetchDataSources,
        defaultDataSourceIdRef: { current: 'existing-ds' },
        uiSettings: mockUiSettings as any,
        loadDefaultDataSourceId: mockLoadDefaultDataSourceId,
        currentWorkspace: null,
        notifications: mockNotifications as any,
      })
    );

    await result.current.handleDataSourceUpdated();

    expect(mockUiSettings.set).not.toHaveBeenCalled();
  });

  it('should not set default when no data sources available', async () => {
    mockFetchDataSources.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useDataSourceUpdater({
        fetchDataSources: mockFetchDataSources,
        defaultDataSourceIdRef: { current: null },
        uiSettings: mockUiSettings as any,
        loadDefaultDataSourceId: mockLoadDefaultDataSourceId,
        currentWorkspace: null,
        notifications: mockNotifications as any,
      })
    );

    await result.current.handleDataSourceUpdated();

    expect(mockUiSettings.set).not.toHaveBeenCalled();
  });

  it('should show warning when error occurs', async () => {
    const error = new Error('Fetch failed');
    mockFetchDataSources.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useDataSourceUpdater({
        fetchDataSources: mockFetchDataSources,
        defaultDataSourceIdRef: { current: null },
        uiSettings: mockUiSettings as any,
        loadDefaultDataSourceId: mockLoadDefaultDataSourceId,
        currentWorkspace: null,
        notifications: mockNotifications as any,
      })
    );

    await result.current.handleDataSourceUpdated();

    expect(mockNotifications.toasts.addWarning).toHaveBeenCalledWith('Fetch failed');
  });
});
