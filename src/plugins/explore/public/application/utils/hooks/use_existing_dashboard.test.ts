/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useExistingDashboard } from './use_existing_dashboard';
import { SavedObjectsClientContract } from 'src/core/public';
import { DashboardInterface } from '../../../components/visualizations/add_to_dashboard_button';

// Mock saved objects client
const mockSavedObjectsClient = ({
  find: jest.fn(),
} as unknown) as SavedObjectsClientContract;

const mockDashboards: DashboardInterface[] = [
  // @ts-expect-error TS2352 TODO(ts-error): fixme
  {
    id: 'dashboard-1',
    attributes: { title: 'Dashboard 1' },
    type: 'dashboard',
    references: [],
  } as DashboardInterface,
  // @ts-expect-error TS2352 TODO(ts-error): fixme
  {
    id: 'dashboard-2',
    attributes: { title: 'Dashboard 2' },
    type: 'dashboard',
    references: [],
  } as DashboardInterface,
];

describe('useExistingDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load dashboards when loadAllDashboards is called', async () => {
    (mockSavedObjectsClient.find as jest.Mock).mockResolvedValue({
      savedObjects: mockDashboards,
    });

    const { result } = renderHook(() => useExistingDashboard(mockSavedObjectsClient));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.dashboardsToShow).toEqual([]);

    act(() => {
      result.current.loadAllDashboards();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(mockSavedObjectsClient.find).toHaveBeenCalledWith({
        type: 'dashboard',
      });
      expect(result.current.dashboardsToShow).toEqual(mockDashboards);
      expect(result.current.selectedDashboard).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should not load dashboards on mount by default', () => {
    const { result } = renderHook(() => useExistingDashboard(mockSavedObjectsClient));

    expect(result.current.isLoading).toBe(false);
    expect(mockSavedObjectsClient.find).not.toHaveBeenCalled();
    expect(result.current.dashboardsToShow).toEqual([]);
  });

  it('should search dashboards with search term', async () => {
    (mockSavedObjectsClient.find as jest.Mock).mockResolvedValue({
      savedObjects: [mockDashboards[0]],
    });

    const { result } = renderHook(() => useExistingDashboard(mockSavedObjectsClient));

    act(() => {
      result.current.searchDashboards('Dashboard 1');
    });

    expect(result.current.isSearching).toBe(true);

    await waitFor(() => {
      expect(mockSavedObjectsClient.find).toHaveBeenCalledWith({
        type: 'dashboard',
        search: '*Dashboard 1*',
        searchFields: ['title'],
        perPage: 100,
      });
      expect(result.current.dashboardsToShow).toEqual([mockDashboards[0]]);
      expect(result.current.isSearching).toBe(false);
    });
  });

  it('should clear search when empty search term is provided', async () => {
    const { result } = renderHook(() => useExistingDashboard(mockSavedObjectsClient));

    act(() => {
      result.current.searchDashboards('');
    });

    expect(result.current.dashboardsToShow).toEqual([]);
    expect(result.current.searchValue).toBe('');
    expect(mockSavedObjectsClient.find).not.toHaveBeenCalled();
  });

  it('should set selected dashboard', () => {
    const { result } = renderHook(() => useExistingDashboard(mockSavedObjectsClient));

    act(() => {
      result.current.setSelectedDashboard(mockDashboards[1]);
    });

    expect(result.current.selectedDashboard).toEqual(mockDashboards[1]);
  });

  it('should allow removing selected dashboard', () => {
    const { result } = renderHook(() => useExistingDashboard(mockSavedObjectsClient));

    // First set a dashboard
    act(() => {
      result.current.setSelectedDashboard(mockDashboards[0]);
    });

    expect(result.current.selectedDashboard).toEqual(mockDashboards[0]);

    // Then clear/remove it
    act(() => {
      result.current.setSelectedDashboard(null);
    });

    expect(result.current.selectedDashboard).toBe(null);
  });

  it('should show dashboards from search results when searching', async () => {
    (mockSavedObjectsClient.find as jest.Mock)
      .mockResolvedValueOnce({ savedObjects: mockDashboards }) // for loadAllDashboards
      .mockResolvedValueOnce({ savedObjects: [mockDashboards[0]] }); // for searchDashboards

    const { result } = renderHook(() => useExistingDashboard(mockSavedObjectsClient));

    // Load dashboards first
    act(() => {
      result.current.loadAllDashboards();
    });

    await waitFor(() => {
      // Initially shows all dashboards
      expect(result.current.dashboardsToShow).toEqual(mockDashboards);
    });

    // After search, shows search results
    act(() => {
      result.current.searchDashboards('Dashboard 1');
    });

    await waitFor(() => {
      expect(result.current.dashboardsToShow).toEqual([mockDashboards[0]]);
    });
  });

  it('should handle errors gracefully', async () => {
    (mockSavedObjectsClient.find as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useExistingDashboard(mockSavedObjectsClient));

    act(() => {
      result.current.loadAllDashboards();
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.dashboardsToShow).toEqual([]);
      expect(result.current.selectedDashboard).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
