/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export enum DirectQueryLoadingStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  RUNNING = 'running',
  SCHEDULED = 'scheduled',
  CANCELED = 'canceled',
  WAITING = 'waiting',
  INITIAL = 'initial',
}

const catalogCacheFetchingStatus = [
  DirectQueryLoadingStatus.RUNNING,
  DirectQueryLoadingStatus.WAITING,
  DirectQueryLoadingStatus.SCHEDULED,
];

export const isCatalogCacheFetching = (...statuses: DirectQueryLoadingStatus[]) => {
  return statuses.some((status: DirectQueryLoadingStatus) =>
    catalogCacheFetchingStatus.includes(status)
  );
};
