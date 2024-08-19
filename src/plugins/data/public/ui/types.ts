/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { SearchInterceptor } from '../search';
import { DataSetNavigatorProps } from './dataset_navigator';
import { IndexPatternSelectProps } from './index_pattern_select';
import { StatefulSearchBarProps } from './search_bar';
import { QueryEditorExtensionConfig } from './query_editor/query_editor_extensions';
import { SuggestionsComponentProps } from './typeahead/suggestions_component';
import { EditorInstance } from './query_editor/editors';

export interface QueryEnhancement {
  language: string;
  search: SearchInterceptor;
  editor: (
    collapsedProps: any,
    expandedProps: any,
    bodyProps: any
  ) => EditorInstance<any, any, any>;
  meta?: {
    queryStringInput: {
      // will replace '<data_source>' with the data source name
      initialValue: string;
    };
  };
  fields?: {
    visualizable?: boolean;
  };
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
  /**
   * @experimental - Subject to change
   */
  DataSetNavigator: React.ComponentType<DataSetNavigatorProps>;
  SearchBar: React.ComponentType<StatefulSearchBarProps>;
  SuggestionsComponent: React.ComponentType<SuggestionsComponentProps>;
  dataSetContainer$: Observable<HTMLDivElement | null>;
}
