/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IndexPatternSelectProps } from './index_pattern_select';
import { StatefulSearchBarProps } from './search_bar';
import { SuggestionsComponentProps } from './typeahead/suggestions_component';

export interface SearchBarControl {
  order: number;
  render: () => React.ReactNode;
}

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
  IndexPatternSelect: React.ComponentType<IndexPatternSelectProps>;
  SearchBar: React.ComponentType<StatefulSearchBarProps>;
  SuggestionsComponent: React.ComponentType<SuggestionsComponentProps>;
  addSearchBarControl: (control: SearchBarControl) => void;
}
