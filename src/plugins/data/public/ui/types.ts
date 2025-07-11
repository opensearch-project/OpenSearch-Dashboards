/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetSelectProps } from './dataset_select';
import { IndexPatternSelectProps } from './index_pattern_select';
import { StatefulSearchBarProps } from './search_bar';
import { SuggestionsComponentProps } from './typeahead/suggestions_component';

/**
 * The setup contract exposed by the Search plugin exposes the search strategy extension
 * point.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IUiSetup {}

/**
 * Data plugin prewired UI components
 */
export interface IUiStart {
  DatasetSelect: React.ComponentType<DatasetSelectProps>;
  IndexPatternSelect: React.ComponentType<IndexPatternSelectProps>;
  SearchBar: React.ComponentType<StatefulSearchBarProps>;
  SuggestionsComponent: React.ComponentType<SuggestionsComponentProps>;
}
