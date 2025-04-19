/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionByType, createAction } from '../../../ui_actions/public';

export const ACTION_ABORT_DATA_QUERY = 'ACTION_ABORT_DATA_QUERY';

export interface AbortDataQueryContext {
  abortControllerRef: React.MutableRefObject<AbortController | undefined>;
}

// Create the action creator function
export function createAbortDataQueryAction(): ActionByType<typeof ACTION_ABORT_DATA_QUERY> {
  return createAction<typeof ACTION_ABORT_DATA_QUERY>({
    type: ACTION_ABORT_DATA_QUERY,
    id: ACTION_ABORT_DATA_QUERY,
    shouldAutoExecute: async () => true,
    execute: async (context: AbortDataQueryContext) => {
      try {
        const { abortControllerRef } = context;
        if (abortControllerRef.current) {
          // Abort existing query
          abortControllerRef.current.abort();
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Error [ACTION_ABORT_DATA_QUERY]: Failed to abort data query`, e);
      }
    },
  });
}
