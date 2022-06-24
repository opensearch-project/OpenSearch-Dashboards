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

import { IStateStorage } from './types';

/**
 * {@link IStateStorage} for storing state in browser {@link Storage}
 * {@link https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/opensearch_dashboards_utils/docs/state_sync/storages/session_storage.md | guide}
 * @public
 */
export interface ISessionStorageStateStorage extends IStateStorage {
  set: <State>(key: string, state: State) => void;
  get: <State = unknown>(key: string) => State | null;
}

/**
 * Creates {@link ISessionStorageStateStorage}
 * {@link https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/opensearch_dashboards_utils/docs/state_sync/storages/session_storage.md | guide}
 * @param storage - Option {@link Storage} to use for storing state. By default window.sessionStorage.
 * @returns - {@link ISessionStorageStateStorage}
 * @public
 */
export const createSessionStorageStateStorage = (
  storage: Storage = window.sessionStorage
): ISessionStorageStateStorage => {
  return {
    set: <State>(key: string, state: State) => storage.setItem(key, JSON.stringify(state)),
    get: (key: string) => JSON.parse(storage.getItem(key)!),
  };
};
