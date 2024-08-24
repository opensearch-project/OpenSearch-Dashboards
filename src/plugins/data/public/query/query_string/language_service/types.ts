/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISearchInterceptor } from '../../../search';

export interface LanguageConfig {
  id: string;
  title: string;
  search: ISearchInterceptor;
  // Leave blank to support all data sources
  // supportedDataSourceTypes?: Record<string, GenericDataSource>;
  searchBar?: {
    showDataSetsSelector?: boolean;
    showDataSourcesSelector?: boolean;
    showQueryInput?: boolean;
    showFilterBar?: boolean;
    showDatePicker?: boolean;
    showAutoRefreshOnly?: boolean;
    queryStringInput?: {
      // will replace '<data_source>' with the data source name
      initialValue?: string;
    };
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
