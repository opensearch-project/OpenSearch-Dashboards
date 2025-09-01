/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionByType, createAction } from '../../../ui_actions/public';

export const ACTION_ABORT_DATA_QUERY = 'ACTION_ABORT_DATA_QUERY';

export interface AbortDataQueryContext {
  reason: string;
}

// Create the action creator function
export function createAbortDataQueryAction(
  refs: Array<React.MutableRefObject<{ abortController: AbortController | undefined }>>,
  actionId: string
): ActionByType<typeof ACTION_ABORT_DATA_QUERY> {
  return createAction<typeof ACTION_ABORT_DATA_QUERY>({
    type: ACTION_ABORT_DATA_QUERY,
    id: actionId,
    shouldAutoExecute: async () => true,
    execute: async (context: AbortDataQueryContext) => {
      try {
        refs.forEach((ref) => {
          const controller = ref.current?.abortController;
          controller?.abort?.(context.reason);
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`[ACTION_ABORT_DATA_QUERY] Failed to abort data query:`, e);
      }
    },
  });
}
