/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DirectQueryLoadingStatus } from '../framework/types';

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
