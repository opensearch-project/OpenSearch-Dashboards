/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseError } from '@opensearch-project/opensearch-next/lib/errors';
import { errors as LegacyErrors } from 'elasticsearch';
import { SavedObjectsErrorHelpers } from '../../../../../src/core/server';
import { OsdError } from '../../../opensearch_dashboards_utils/common';

export class DataSourceError extends OsdError {
  // must have statusCode to avoid route handler in search.ts to return 500
  statusCode: number;
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

    if (statusCode) {
      this.statusCode = statusCode;
    } else if (error.statusCode) {
      this.statusCode = error.statusCode;
    } else {
      this.statusCode = 400;
    }
  }
}

export const createDataSourceError = (error: any, message?: string): DataSourceError => {
  // handle saved object client error, while retrieve data source meta info
  if (SavedObjectsErrorHelpers.isSavedObjectsClientError(error)) {
    return new DataSourceError(error, error.output.payload.message, error.output.statusCode);
  }

  // cast OpenSearch client 401 response error to 400, due to https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2591
  if (isResponseError(error) && error.statusCode === 401) {
    return new DataSourceError(error, JSON.stringify(error.meta.body), 400);
  }

  // cast legacy client 401 response error to 400
  if (error instanceof LegacyErrors.AuthenticationException) {
    return new DataSourceError(error, error.message, 400);
  }

  // handle all other error that may or may not comes with statuscode
  return new DataSourceError(error, message);
};

const isResponseError = (error: any): error is ResponseError => {
  return Boolean(error.body && error.statusCode && error.headers);
};
