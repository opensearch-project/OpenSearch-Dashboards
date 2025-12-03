/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';

/**
 * @deprecated - use DefaultDiscoverTable
 */
export interface DataGridContextProps {
  inspectedHit?: OpenSearchSearchHit;
  onFilter: DocViewFilterFn;
  setInspectedHit: (hit?: OpenSearchSearchHit) => void;
  rows: OpenSearchSearchHit[];
  indexPattern: IndexPattern;
}

/**
 * @deprecated - use DefaultDiscoverTable
 */
export const DataGridContext = React.createContext<DataGridContextProps>(
  {} as DataGridContextProps
);

/**
 * @deprecated - use DefaultDiscoverTable
 */
export const DiscoverGridContextProvider = DataGridContext.Provider;

/**
 * @deprecated - use DefaultDiscoverTable
 */
export const useDataGridContext = () => React.useContext(DataGridContext);
