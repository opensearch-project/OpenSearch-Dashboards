/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useEffect } from 'react';
import { DiscoverServices } from '../../../../build_services';
import { SavedSearch } from '../../../../saved_searches';
import { useSavedSearch } from '../../utils/use_saved_search';
import { IndexPattern } from '../../../../opensearch_dashboards_services';

export interface DiscoverTableServiceProps {
  services: DiscoverServices;
  savedSearch: SavedSearch;
  indexPattern: IndexPattern;
}

export const useDiscoverTableService = ({
  services,
  savedSearch,
  indexPattern,
}: DiscoverTableServiceProps) => {
  const searchSource = useMemo(() => {
    savedSearch.searchSource.setField('index', indexPattern);
    return savedSearch.searchSource;
  }, [savedSearch, indexPattern]);

  const { data$, refetch$ } = useSavedSearch({
    searchSource,
    services,
    indexPattern,
  });

  useEffect(() => {
    const dataSubscription = data$.subscribe((data) => {});
    const refetchSubscription = refetch$.subscribe((refetch) => {});

    return () => {
      dataSubscription.unsubscribe();
      refetchSubscription.unsubscribe();
    };
  }, [data$, refetch$]);

  return {
    data$,
    refetch$,
    indexPattern,
  };
};
