/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';

export interface DataGridContextProps {
  inspectedHit?: OpenSearchSearchHit;
  onFilter: DocViewFilterFn;
  setInspectedHit: (hit?: OpenSearchSearchHit) => void;
  rows: OpenSearchSearchHit[];
  indexPattern: IndexPattern;
}

export const DataGridContext = React.createContext<DataGridContextProps>(
  {} as DataGridContextProps
);

export const DiscoverGridContextProvider = DataGridContext.Provider;
export const useDataGridContext = () => React.useContext(DataGridContext);
