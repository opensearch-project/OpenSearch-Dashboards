/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { SavedObjectsClientContract } from 'src/core/public';
import { DashboardInterface } from '../../../components/visualizations/add_to_dashboard_button';

export interface UseExistingDashboardReturn {
  selectedDashboard: DashboardInterface | null;
  dashboardsToShow: DashboardInterface[];
  searchValue: string;
  isLoading: boolean;
  isSearching: boolean;
  error: Error | null;
  setSelectedDashboard: (dashboard: DashboardInterface | null) => void;
  searchDashboards: (searchTerm: string) => Promise<void>;
  loadAllDashboards: () => Promise<void>;
}

export const useExistingDashboard = (
  savedObjectsClient: SavedObjectsClientContract
): UseExistingDashboardReturn => {
  const [dashboards, setDashboards] = useState<DashboardInterface[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardInterface | null>(null);
  const [searchResults, setSearchResults] = useState<DashboardInterface[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);

  const loadAllDashboards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await savedObjectsClient.find({
        type: 'dashboard',
      });
      const dashboardList = res.savedObjects as DashboardInterface[];
      setDashboards(dashboardList);
    } catch (err) {
      setError(err as Error);
      setDashboards([]);
      setSelectedDashboard(null);
    } finally {
      setIsLoading(false);
    }
  }, [savedObjectsClient]);

  const searchDashboards = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setSearchValue('');
        return;
      }

      setIsSearching(true);
      try {
        const res = await savedObjectsClient.find({
          type: 'dashboard',
          search: `*${searchTerm}*`,
          searchFields: ['title'],
          perPage: 100,
        });
        setSearchResults(res.savedObjects as DashboardInterface[]);
        setSearchValue(searchTerm);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [savedObjectsClient]
  );

  // Computed value: which dashboards to show
  const dashboardsToShow = searchValue.trim() ? searchResults : dashboards;

  return {
    // Data
    selectedDashboard,
    dashboardsToShow,
    searchValue,

    // Loading states
    isLoading,
    isSearching,
    error,

    // Actions
    setSelectedDashboard,
    searchDashboards,
    loadAllDashboards,
  };
};
