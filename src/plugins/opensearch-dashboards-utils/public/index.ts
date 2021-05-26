/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

export {
  calculateObjectHash,
  defer,
  Defer,
  fieldWildcardFilter,
  fieldWildcardMatcher,
  Get,
  JsonArray,
  JsonObject,
  JsonValue,
  of,
  Set,
  UiComponent,
  UiComponentInstance,
  url,
  createGetterSetter,
} from '../common';
export * from './core';
export * from '../common/errors';
export * from './render-complete';
export * from './resize-checker';
export * from '../common/state-containers';
export * from './storage';
export { hashedItemStore, HashedItemStore } from './storage/hashed-item-store';
export {
  createStateHash,
  persistState,
  retrieveState,
  isStateHash,
} from './state-management/state-hash';
export {
  hashQuery,
  hashUrl,
  unhashUrl,
  unhashQuery,
  createUrlTracker,
  createOsdUrlTracker,
  createOsdUrlControls,
  getStateFromOsdUrl,
  getStatesFromOsdUrl,
  setStateToOsdUrl,
  withNotifyOnErrors,
} from './state-management/url';
export {
  syncState,
  syncStates,
  createOsdUrlStateStorage,
  createSessionStorageStateStorage,
  IStateSyncConfig,
  ISyncStateRef,
  IOsdUrlStateStorage,
  INullableBaseStateContainer,
  ISessionStorageStateStorage,
  StartSyncStateFnType,
  StopSyncStateFnType,
} from './state-sync';
export { Configurable, CollectConfigProps } from './ui';
export { removeQueryParam, redirectWhenMissing } from './history';
export { applyDiff } from './state-management/utils/diff_object';
export { createStartServicesGetter, StartServicesGetter } from './core/create_start_service_getter';

/** dummy plugin, we just want opensearchDashboardsUtils to have its own bundle */
export function plugin() {
  return new (class OpenSearchUtilsPlugin {
    setup() {}
    start() {}
  })();
}
