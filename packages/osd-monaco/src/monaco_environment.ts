/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWorker } from './worker_store';

// @ts-ignore
window.MonacoEnvironment = {
  getWorker: (module: string, languageId: string) => {
    const workerSrc = getWorker(languageId);
    if (workerSrc) {
      const blob = new Blob([workerSrc], { type: 'application/javascript' });
      return new Worker(URL.createObjectURL(blob));
    }
  },
};
