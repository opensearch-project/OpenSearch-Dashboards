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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
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
