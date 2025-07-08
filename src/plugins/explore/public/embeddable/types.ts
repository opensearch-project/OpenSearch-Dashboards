/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Embeddable, EmbeddableInput, EmbeddableOutput } from '../../../embeddable/public';
import { Filter, IIndexPattern, TimeRange } from '../../../data/public';
import { QueryState } from '../application/utils/state_management/slices';
import { SortOrder } from '../types/saved_explore_types';

export interface ExploreInput extends EmbeddableInput {
  timeRange: TimeRange;
  query?: QueryState;
  filters?: Filter[];
  hidePanelTitles?: boolean;
  columns?: string[];
  sort?: SortOrder[];
}

export interface ExploreOutput extends EmbeddableOutput {
  editUrl: string;
  indexPatterns?: IIndexPattern[];
  editable: boolean;
}

export interface ExploreEmbeddable extends Embeddable<ExploreInput, ExploreOutput> {
  type: string;
}
