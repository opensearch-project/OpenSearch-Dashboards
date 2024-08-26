/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISearchInterceptor } from '../../../search';
import { Query } from '../../../../public';

export interface LanguageConfig {
  id: string;
  title: string;
  search: ISearchInterceptor;
  getQueryString: (query: Query) => string;
  searchBar?: {
    showQueryInput?: boolean;
    showFilterBar?: boolean;
    showDatePicker?: boolean;
    showAutoRefreshOnly?: boolean;
    dateRange?: {
      initialFrom?: string;
      initialTo?: string;
    };
  };
  fields?: {
    filterable?: boolean;
    visualizable?: boolean;
  };
  showDocLinks?: boolean;
  supportedAppNames: string[];
}
