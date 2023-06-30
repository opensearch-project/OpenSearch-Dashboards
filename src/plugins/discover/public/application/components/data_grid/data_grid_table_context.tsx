/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { DocViewFilterFn } from '../../doc_views/doc_views_types';

export interface DataGridContextProps {
  docViewExpand: any;
  onFilter: DocViewFilterFn;
  setDocViewExpand: (hit: any) => void;
  rows: any[];
  indexPattern: IndexPattern;
}

export const DataGridContext = React.createContext<DataGridContextProps>(
  ({} as unknown) as DataGridContextProps
);
