/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { SearchInterceptor } from '../search';
import { IndexPatternSelectProps } from './index_pattern_select';
import { StatefulSearchBarProps } from './search_bar';
import { Settings } from './settings';
import { SearchBarExtensionConfig } from './search_bar_extensions';
import { SuggestionsComponentProps } from './typeahead/suggestions_component';

export * from './settings';

export interface QueryEnhancement {
  // TODO: MQL do want to default have supported all data_sources?
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
    extensions?: SearchBarExtensionConfig[];
  };
  fields?: {
    filterable?: boolean;
    visualizable?: boolean;
  };
  showDocLinks?: boolean;
  // List of supported app names that this enhancement should be enabled for,
  // if not provided it will be enabled for all apps
  supportedAppNames?: string[];
}

export interface UiEnhancements {
  query?: QueryEnhancement;
}

/**
 * The setup contract exposed by the Search plugin exposes the search strategy extension
 * point.
 */
export interface IUiSetup {
  __enhance: (enhancements: UiEnhancements) => void;
}

/**
 * Data plugin prewired UI components
 */
export interface IUiStart {
  isEnhancementsEnabled: boolean;
  queryEnhancements: Map<string, QueryEnhancement>;
  IndexPatternSelect: React.ComponentType<IndexPatternSelectProps>;
  SearchBar: React.ComponentType<StatefulSearchBarProps>;
  SuggestionsComponent: React.ComponentType<SuggestionsComponentProps>;
  Settings: Settings;
  containerRef: HTMLDivElement | null;
  container$: BehaviorSubject<HTMLDivElement | null>;
}
