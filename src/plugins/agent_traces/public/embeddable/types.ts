/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectReference } from 'opensearch-dashboards/public';
import { Embeddable, EmbeddableInput, EmbeddableOutput } from '../../../embeddable/public';
import { Filter, IIndexPattern, TimeRange } from '../../../data/public';
import { QueryState } from '../application/utils/state_management/slices';
import { SortOrder, SavedAgentTraces } from '../types/saved_agent_traces_types';

export interface AgentTracesInput extends EmbeddableInput {
  timeRange: TimeRange;
  query?: QueryState;
  filters?: Filter[];
  hidePanelTitles?: boolean;
  columns?: string[];
  sort?: SortOrder[];
  // attributes and references are used to create embeddables without storing saved object
  attributes?: AgentTracesByValueAttributes;
  references?: SavedObjectReference[];
}

export interface AgentTracesOutput extends EmbeddableOutput {
  editUrl: string;
  indexPatterns?: IIndexPattern[];
  editable: boolean;
}

export interface AgentTracesEmbeddable extends Embeddable<AgentTracesInput, AgentTracesOutput> {
  type: string;
}

type AgentTracesByValueAttributes = Pick<
  SavedAgentTraces,
  | 'title'
  | 'description'
  | 'columns'
  | 'sort'
  | 'type'
  | 'visualization'
  | 'uiState'
  | 'kibanaSavedObjectMeta'
>;
