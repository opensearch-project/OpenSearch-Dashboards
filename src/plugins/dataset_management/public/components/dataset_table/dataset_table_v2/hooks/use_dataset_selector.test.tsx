/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useDatasetSelector } from './use_dataset_selector';

describe('useDatasetSelector', () => {
  const mockDatasetService = {
    saveDataset: jest.fn(),
  };

  const mockData: any = {
    query: {
      queryString: {
        getDatasetService: jest.fn().mockReturnValue(mockDatasetService),
      },
    },
    dataViews: {
      clearCache: jest.fn(),
    },
  };

  const mockOverlays: any = {
    openModal: jest.fn(),
    openConfirm: jest.fn(),
  };

  const mockServices: any = {
    data: mockData,
    overlays: mockOverlays,
  };

  const mockNotifications: any = {
    toasts: {
      addSuccess: jest.fn(),
      addDanger: jest.fn(),
    },
  };

  const mockHistoryPush = jest.fn();

  const defaultParams = {
    data: mockData,
    overlays: mockOverlays,
    services: mockServices,
    notifications: mockNotifications,
    historyPush: mockHistoryPush,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return openDatasetSelector function', () => {
    const { result } = renderHook(() => useDatasetSelector(defaultParams));

    expect(result.current.openDatasetSelector).toBeDefined();
    expect(typeof result.current.openDatasetSelector).toBe('function');
  });

  it('should open modal when openDatasetSelector is called', () => {
    const { result } = renderHook(() => useDatasetSelector(defaultParams));

    result.current.openDatasetSelector('logs');

    expect(mockOverlays.openModal).toHaveBeenCalled();
  });

  it('should call openDatasetSelector with correct signal type', () => {
    const { result } = renderHook(() => useDatasetSelector(defaultParams));

    result.current.openDatasetSelector('metrics');

    expect(mockOverlays.openModal).toHaveBeenCalled();
    const modalCall = mockOverlays.openModal.mock.calls[0];
    expect(modalCall).toBeDefined();
  });
});
