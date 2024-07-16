/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { SearchInterceptor } from '../search';
import { IndexPatternSelectProps } from './index_pattern_select';
import { StatefulSearchBarProps } from './search_bar';
import { QueryEditorExtensionConfig } from './query_editor/query_editor_extensions';
import { Settings } from './settings';
import { SuggestionsComponentProps } from './typeahead/suggestions_component';
import { QueryLanguageSelectorProps } from './query_editor/language_selector';

export * from './settings';

export interface QueryEnhancement {
  // TODO: MQL do want to default have supported all data_sources?
  // or should data connect have a record of query enhancements that are supported
  language: string;
  search: SearchInterceptor;
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
  // List of supported app names that this enhancement should be enabled for,
  // if not provided it will be enabled for all apps
  supportedAppNames?: string[];
}

export interface UiEnhancements {
  query?: QueryEnhancement;
  queryEditorExtension?: QueryEditorExtensionConfig;
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
  IndexPatternSelect: React.ComponentType<IndexPatternSelectProps>;
  SearchBar: React.ComponentType<StatefulSearchBarProps>;
  SuggestionsComponent: React.ComponentType<SuggestionsComponentProps>;
  QueryLanguageSelector: React.ComponentType<QueryLanguageSelectorProps>;
  languageSelectorContainer$: Observable<HTMLDivElement | null>;
  Settings: Settings;
  dataSourceContainer$: Observable<HTMLDivElement | null>;
  dataSourceFooter$: Observable<HTMLDivElement | null>;
  container$: Observable<HTMLDivElement | null>;
}
