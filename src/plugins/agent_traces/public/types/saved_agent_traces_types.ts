/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from '../../../saved_objects/public';
import { ISearchSource } from '../../../data/public';

export type SortDirection = 'asc' | 'desc';
export type SortOrder = [string, SortDirection];
export interface SavedAgentTraces
  extends Pick<
    SavedObject,
    | 'id'
    | 'title'
    | 'copyOnSave'
    | 'destroy'
    | 'lastSavedTitle'
    | 'save'
    | 'getFullPath'
    | 'getOpenSearchType'
    | 'searchSourceFields'
  > {
  searchSource: ISearchSource; // This is optional in SavedObject, but required for SavedSearch
  description?: string;
  legacyState?: string; // Serialized legacy state (columns, sort, interval, etc.)
  uiState?: string; // Serialized UI state
  queryState?: string; // Serialized query state
  version?: number;
  visualization?: string; // Serialized visualization state
  type?: string;
  kibanaSavedObjectMeta?: {
    searchSourceJSON: string;
  };
  sort?: SortOrder[];
  columns?: string[];
}

export interface SavedAgentTracesAttributes {
  id?: string;
  title: string;
  description?: string;
  legacyState: string; // Serialized legacy state
  uiState: string; // Serialized UI state
  queryState: string; // Serialized query state
  version: number;
  kibanaSavedObjectMeta: {
    searchSourceJSON: string;
  };
}
export interface SavedAgentTracesLoader {
  get: (id: string) => Promise<SavedAgentTraces>;
  urlFor: (id: string) => string;
}
