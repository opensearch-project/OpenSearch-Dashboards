/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const workerStoreMap: Record<string, string> = {};

export const registerWorker = (workerId: string, worker: string) => {
  if (!workerStoreMap[workerId]) {
    workerStoreMap[workerId] = worker;
    return true;
  }

  return false;
};

export const getWorker = (workerId: string) => {
  return workerStoreMap[workerId];
};
