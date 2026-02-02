/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWorkerUrl, WorkerLabels } from './worker_config';

let buildHash: number | undefined;

/**
 * Sets the build hash for worker URL generation.
 * This should be called during application initialization before any workers are created.
 * @param hash The build hash string
 */
export function setBuildHash(hash: number): void {
  buildHash = hash;
}

/**
 * Creates a web worker from a served URL based on the worker label.
 * @param label The worker label/ID (e.g., 'ppl', 'json', 'xjson')
 * @returns A new Worker instance
 */
export function getWorker(label: WorkerLabels): Worker {
  if (!buildHash) {
    throw new Error('Build hash must be set before initializing editor workers');
  }

  const workerUrl = getWorkerUrl(label, buildHash);
  if (!workerUrl) {
    throw new Error(`No worker available for language: ${label}`);
  }

  return new Worker(workerUrl);
}

// @ts-ignore
window.MonacoEnvironment = {
  getWorker,
};
