/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Embeddable, EmbeddableInput, EmbeddableOutput } from '../../../embeddable/public';
import { Filter, IIndexPattern, TimeRange, Query } from '../../../data/public';
import { SortOrder } from '../types/saved_explore_types';

export interface SearchInput extends EmbeddableInput {
  timeRange: TimeRange;
  query?: Query;
  filters?: Filter[];
  hidePanelTitles?: boolean;
  columns?: string[];
  sort?: SortOrder[];
}

export interface SearchOutput extends EmbeddableOutput {
  editUrl: string;
  indexPatterns?: IIndexPattern[];
  editable: boolean;
}

export interface SearchEmbeddable extends Embeddable<SearchInput, SearchOutput> {
  type: string;
}
