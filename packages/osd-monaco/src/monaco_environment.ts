/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWorker } from './worker_store';

// @ts-ignore
window.MonacoEnvironment = {
  getWorker: (_: string, label: string) => {
    const workerSrc = getWorker(label);
    if (workerSrc) {
      const blob = new Blob([workerSrc], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      return worker;
    }
    throw new Error(`No worker available for language: ${label}`);
  },
};
