/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchInterceptor } from '../search';
import { IndexPatternSelectProps } from './index_pattern_select';
import { StatefulSearchBarProps } from './search_bar';
import { Settings } from './settings';

export * from './settings';

export interface QueryEnhancement {
  // TODO: SQL do want to default have supported all data_sources?
  // or should data connect have a record of query enhancements that are supported
  language: string;
  search: SearchInterceptor;
  // Leave blank to support all data sources
  // supportedDataSourceTypes?: Record<string, GenericDataSource>;
  searchBar?: {
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
}

export interface UiEnhancements {
  query?: QueryEnhancement;
}

/**
 * Data plugin prewired UI components
 */
export interface DataPublicPluginStartUi {
  queryEnhancements: Map<string, QueryEnhancement>;
  IndexPatternSelect: React.ComponentType<IndexPatternSelectProps>;
  SearchBar: React.ComponentType<StatefulSearchBarProps>;
  Settings: Settings;
}
