/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { DiscoverServices } from '../../../build_services';
import { SavedSearch } from '../../../saved_searches';
import { useDiscoverTableService } from './utils/use_discover_canvas_service';
import { DiscoverTableApplication } from './discover_table_app';

export interface DiscoverTableAppProps {
  services: DiscoverServices;
  savedSearch: SavedSearch;
  indexPattern: IndexPattern;
}

export const DiscoverTableService = ({
  services,
  savedSearch,
  indexPattern,
}: DiscoverTableAppProps) => {
  const { data$, refetch$ } = useDiscoverTableService({
    services,
    savedSearch,
    indexPattern,
  });

  // trigger manual fetch
  // ToDo: remove this once we implement refetch data:
  // Based on the controller, refetch$ should emit next when
  // 1) appStateContainer interval and sort change
  // 2) savedSearch id changes
  // 3) timefilter.getRefreshInterval().pause === false
  // 4) TopNavMenu updateQuery() is called
  useEffect(() => {
    refetch$.next();
  }, [refetch$]);

  return (
    <DiscoverTableApplication
      data$={data$}
      indexPattern={indexPattern}
      savedSearch={savedSearch}
      services={services}
    />
  );
};
