/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createStateContainer,
  syncState,
  IOsdUrlStateStorage,
} from '../../../../../../../opensearch_dashboards_utils/public';
import { Dataset } from '../../../../../../../data/common';

export interface TraceAppState {
  traceId: string;
  dataset: Dataset;
  spanId?: string;
}

const STATE_STORAGE_KEY = '_a';

export const createTraceAppState = ({
  stateDefaults,
  osdUrlStateStorage,
}: {
  stateDefaults: TraceAppState;
  osdUrlStateStorage: IOsdUrlStateStorage;
}) => {
  const initialStateFromUrl = osdUrlStateStorage.get<TraceAppState>(STATE_STORAGE_KEY);
  const initialState: TraceAppState = {
    ...stateDefaults,
    ...initialStateFromUrl,
  };

  const stateContainer = createStateContainer(initialState, {
    setTraceId: (state: TraceAppState) => (traceId: string) => ({
      ...state,
      traceId,
    }),
    setDataset: (state: TraceAppState) => (dataset: Dataset) => ({
      ...state,
      dataset,
    }),
    setSpanId: (state: TraceAppState) => (spanId?: string) => ({
      ...state,
      spanId,
    }),
    updateState: (state: TraceAppState) => (newState: Partial<TraceAppState>) => ({
      ...state,
      ...newState,
    }),
  });

  if (!initialStateFromUrl) {
    osdUrlStateStorage.set<TraceAppState>(STATE_STORAGE_KEY, initialState, {
      replace: true,
    });
  }

  const { start: startStateSync, stop: stopStateSync } = syncState({
    stateStorage: osdUrlStateStorage,
    stateContainer: {
      ...stateContainer,
      set: (state: TraceAppState | null) => {
        if (state) {
          stateContainer.set(state);
        }
      },
    },
    storageKey: STATE_STORAGE_KEY,
  });

  startStateSync();

  return {
    stateContainer,
    stopStateSync,
  };
};
