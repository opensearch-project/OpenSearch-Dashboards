/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { Filter, IIndexPattern, Query, TimeRange } from '../../../data/public';
import {
  Embeddable,
  EmbeddableInput,
  EmbeddableOutput,
  IEmbeddable,
} from '../../../embeddable/public';
import { SavedExplore, SortOrder } from '../types/saved_explore_types';

export interface ExploreInput extends EmbeddableInput {
  timeRange: TimeRange;
  query?: Query;
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

export interface IExploreEmbeddable extends IEmbeddable<ExploreInput, ExploreOutput> {
  getSavedExplore(): SavedExplore;
}

export interface ExploreEmbeddable extends Embeddable<ExploreInput, ExploreOutput> {
  type: string;
}
