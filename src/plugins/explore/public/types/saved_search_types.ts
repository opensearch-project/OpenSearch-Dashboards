/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from '../../../saved_objects/public';
import { ISearchSource } from '../../../data/public';

export type SortDirection = 'asc' | 'desc';
export type SortOrder = [string, SortDirection];
export interface SavedSearch
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
  > {
  searchSource: ISearchSource; // This is optional in SavedObject, but required for SavedSearch
  description?: string;
  columns: string[];
  sort: SortOrder[];
}
export interface SavedSearchLoader {
  get: (id: string) => Promise<SavedSearch>;
  urlFor: (id: string) => string;
}
