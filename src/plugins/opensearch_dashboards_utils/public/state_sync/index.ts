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

/**
 * State syncing utilities are a set of helpers for syncing your application state
 * with browser URL or browser storage.
 *
 * They are designed to work together with {@link https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/src/plugins/opensearch_dashboards_utils/docs/state_containers | state containers}. But state containers are not required.
 *
 * State syncing utilities include:
 *
 * *{@link syncState} util which:
 *   * Subscribes to state changes and pushes them to state storage.
 *   * Optionally subscribes to state storage changes and pushes them to state.
 *   * Two types of storages compatible with `syncState`:
 *   * {@link IOsdUrlStateStorage} - Serializes state and persists it to URL's query param in rison or hashed format.
 * Listens for state updates in the URL and pushes them back to state.
 *   * {@link ISessionStorageStateStorage} - Serializes state and persists it to browser storage.
 *
 * Refer {@link https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/src/plugins/opensearch_dashboards_utils/docs/state_sync | here} for a complete guide and examples.
 * @packageDocumentation
 */

export {
  createSessionStorageStateStorage,
  createOsdUrlStateStorage,
  IOsdUrlStateStorage,
  ISessionStorageStateStorage,
  IStateStorage,
} from './state_sync_state_storage';
export { IStateSyncConfig, INullableBaseStateContainer } from './types';
export {
  syncState,
  syncStates,
  StopSyncStateFnType,
  StartSyncStateFnType,
  ISyncStateRef,
} from './state_sync';
