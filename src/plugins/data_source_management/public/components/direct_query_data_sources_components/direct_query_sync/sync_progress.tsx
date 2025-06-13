/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DirectQueryLoadingStatus, ExternalIndexState } from '../../../../framework/types';

export type SyncProgress = { in_progress: true; percentage: number } | { in_progress: false };

/**
 * Given the current state of an external index, convert it to a `Progress` value. Since the
 * "active" state doesn't distinguish between a fresh-activated or older activated index, we also
 * need to know if the index has been refreshed before.
 *
 * @param state An index state, as defined by the Flint State Machine.
 * @param queryStatus the Direct Query status for any running queries.
 * @param hasLastRefresh Whether the index has been refreshed before.
 * @returns A `Progress` value
 */
export const asSyncProgress = (
  state: ExternalIndexState | string | null,
  queryStatus: DirectQueryLoadingStatus | null,
  hasLastRefresh: boolean
): SyncProgress => {
  // Query loading status takes precedence if in a processing state, otherwise fallback to state
  switch (queryStatus) {
    case DirectQueryLoadingStatus.SUBMITTED:
      return { in_progress: true, percentage: 0 };
    case DirectQueryLoadingStatus.SCHEDULED:
      return { in_progress: true, percentage: 25 };
    case DirectQueryLoadingStatus.WAITING:
      return { in_progress: true, percentage: 50 };
    case DirectQueryLoadingStatus.RUNNING:
      return { in_progress: true, percentage: 75 };
  }

  switch (state) {
    case ExternalIndexState.ACTIVE:
      if (hasLastRefresh) {
        return { in_progress: false };
      } else {
        // This is equivalent to the 'creating' state: the index was activated but the follow-up
        // population refresh job hasn't kicked in.
        return { in_progress: true, percentage: 30 };
      }
    case ExternalIndexState.CREATING:
      return { in_progress: true, percentage: 30 };
    case ExternalIndexState.REFRESHING:
      return { in_progress: true, percentage: 60 };
    case ExternalIndexState.RECOVERING:
      return { in_progress: true, percentage: 60 };
    case ExternalIndexState.CANCELLING:
      return { in_progress: true, percentage: 90 };
    default:
      // Null state, or other error states
      return { in_progress: false };
  }
};
