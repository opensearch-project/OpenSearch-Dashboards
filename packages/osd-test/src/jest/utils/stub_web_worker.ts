/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

function stubWebWorker() {
  if (!window.Worker) {
    // @ts-ignore we aren't honoring the real Worker spec here
    window.Worker = function Worker() {
      this.postMessage = jest.fn();

      // @ts-ignore TypeScript doesn't think this exists on the Worker interface
      // https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate
      this.terminate = jest.fn();
    };
  }
}

stubWebWorker();

// Add an export to avoid TS complaining "stub_web_worker.ts" is not a module.
export { stubWebWorker };
