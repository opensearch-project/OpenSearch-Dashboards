/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import { OsdError } from '../../../opensearch_dashboards_utils/common';

export class DataSourceError extends OsdError {
  // must have statusCode to avoid route handler in search.ts to return 500
  statusCode: number;
  body: any;

  constructor(error: any, context?: string, statusCode?: number) {
    let message: string;
    if (context) {
      message = context;
    } else if (isResponseError(error)) {
      message = JSON.stringify(error.meta.body);
    } else {
      message = error.message;
    }

    super('Data Source Error: ' + message);

    if (error.body) {
      this.body = error.body;
    }

    if (statusCode) {
      this.statusCode = statusCode;
    } else if (error.statusCode) {
      this.statusCode = error.statusCode;
    } else {
      this.statusCode = 400;
    }
  }
}

export const isResponseError = (error: any): error is ResponseError => {
  return Boolean(error.body && error.statusCode && error.headers);
};
