/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { IndexPatternSelectProps } from './index_pattern_select';
import { StatefulSearchBarProps } from './search_bar';
import { QueryEditorExtensionConfig } from './query_editor/query_editor_extensions';
import { SuggestionsComponentProps } from './typeahead/suggestions_component';

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
  dataSetContainer$: Observable<HTMLDivElement | null>;
}
