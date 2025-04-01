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
      return new Worker(URL.createObjectURL(blob));
    }
    // Return a default worker if no specific worker is found
    return new Worker(URL.createObjectURL(new Blob([''], { type: 'application/javascript' })));
  },
};
