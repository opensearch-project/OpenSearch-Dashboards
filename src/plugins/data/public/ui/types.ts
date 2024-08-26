/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { IndexPatternSelectProps } from './index_pattern_select';
import { StatefulSearchBarProps } from './search_bar';
import { QueryEditorExtensionConfig } from './query_editor/query_editor_extensions';
import { Settings } from './settings';
import { SuggestionsComponentProps } from './typeahead/suggestions_component';

export * from './settings';

export interface UiEnhancements {
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
  /**
   * @experimental - Subject to change
   */
  Settings: Settings;
  dataSetContainer$: Observable<HTMLDivElement | null>;
}
