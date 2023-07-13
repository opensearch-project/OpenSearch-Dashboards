/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { History } from 'history';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { DiscoverServices } from '../../../build_services';
import { SavedSearch } from '../../../saved_searches';
import { DiscoverTableService } from './discover_table_service';
import { fetchIndexPattern, fetchSavedSearch } from '../utils/index_pattern_helper';

export interface DiscoverTableProps {
  services: DiscoverServices;
  history: History;
}

export const DiscoverTable = ({ history, services }: DiscoverTableProps) => {
  const { core, chrome, data, uiSettings: config, toastNotifications } = services;
  const [savedSearch, setSavedSearch] = useState<SavedSearch>();
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);
  // ToDo: get id from data explorer since it is handling the routing logic
  // Original angular code: const savedSearchId = $route.current.params.id;
  const savedSearchId = '';
  useEffect(() => {
    const fetchData = async () => {
      const indexPatternData = await fetchIndexPattern(data, config);
      setIndexPattern(indexPatternData.loaded);

      const savedSearchData = await fetchSavedSearch(
        core,
        '', // basePath
        history,
        savedSearchId,
        services,
        toastNotifications
      );
      if (savedSearchData && !savedSearchData?.searchSource.getField('index')) {
        savedSearchData.searchSource.setField('index', indexPatternData);
      }
      setSavedSearch(savedSearchData);

      if (savedSearchId) {
        chrome.recentlyAccessed.add(
          savedSearchData.getFullPath(),
          savedSearchData.title,
          savedSearchData.id
        );
      }
    };
    fetchData();
  }, [data, config, core, chrome, toastNotifications, history, savedSearchId, services]);

  if (!savedSearch || !savedSearch.searchSource || !indexPattern) {
    // ToDo: handle loading state
    return null;
  }
  return (
    <DiscoverTableService
      services={services}
      savedSearch={savedSearch}
      indexPattern={indexPattern}
    />
  );
};
