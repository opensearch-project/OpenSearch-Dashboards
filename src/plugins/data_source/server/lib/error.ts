/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsErrorHelpers } from '../../../../../src/core/server';
import { OsdError } from '../../../../../src/plugins/opensearch_dashboards_utils/common';

export class DataSourceConfigError extends OsdError {
  // must have statusCode to avoid route handler in search.ts to return 500
  statusCode: number;
  constructor(messagePrefix: string, error: any) {
    const messageContent = SavedObjectsErrorHelpers.isSavedObjectsClientError(error)
      ? error.output.payload.message
      : error.message;
    super(messagePrefix + messageContent);
    // Cast all 5xx error returned by saveObjectClient to 500, 400 for both savedObject client
    // 4xx errors, and other errors
    this.statusCode = SavedObjectsErrorHelpers.isOpenSearchUnavailableError(error) ? 500 : 400;
  }
}
