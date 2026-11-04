/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DataSourceResolution } from './chat_service';

/** Error thrown by ChatService.sendMessage when the run has no usable data source. */
export class DataSourceUnresolvedError extends Error {
  constructor(public readonly resolution: DataSourceResolution) {
    super(`No data source to run with (${resolution.kind})`);
    this.name = 'DataSourceUnresolvedError';
    // Keep `instanceof` working when the build down-levels classes.
    Object.setPrototypeOf(this, DataSourceUnresolvedError.prototype);
  }
}
