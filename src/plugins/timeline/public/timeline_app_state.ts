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

import {
  createStateContainer,
  syncState,
  IOsdUrlStateStorage,
} from '../../opensearch-dashboards-utils/public';

import { TimelineAppState, TimelineAppStateTransitions } from './types';

const STATE_STORAGE_KEY = '_a';

interface Arguments {
  osdUrlStateStorage: IOsdUrlStateStorage;
  stateDefaults: TimelineAppState;
}

export function initTimelineAppState({ stateDefaults, osdUrlStateStorage }: Arguments) {
  const urlState = osdUrlStateStorage.get<TimelineAppState>(STATE_STORAGE_KEY);
  const initialState = {
    ...stateDefaults,
    ...urlState,
  };

  /*
    make sure url ('_a') matches initial state
    Initializing appState does two things - first it translates the defaults into AppState,
    second it updates appState based on the url (the url trumps the defaults). This means if
    we update the state format at all and want to handle BWC, we must not only migrate the
    data stored with saved vis, but also any old state in the url.
  */
  osdUrlStateStorage.set(STATE_STORAGE_KEY, initialState, { replace: true });

  const stateContainer = createStateContainer<TimelineAppState, TimelineAppStateTransitions>(
    initialState,
    {
      set: (state) => (prop, value) => ({ ...state, [prop]: value }),
      updateState: (state) => (newValues) => ({ ...state, ...newValues }),
    }
  );

  const { start: startStateSync, stop: stopStateSync } = syncState({
    storageKey: STATE_STORAGE_KEY,
    stateContainer: {
      ...stateContainer,
      set: (state) => {
        if (state) {
          // syncState utils requires to handle incoming "null" value
          stateContainer.set(state);
        }
      },
    },
    stateStorage: osdUrlStateStorage,
  });

  // start syncing the appState with the ('_a') url
  startStateSync();

  return { stateContainer, stopStateSync };
}
