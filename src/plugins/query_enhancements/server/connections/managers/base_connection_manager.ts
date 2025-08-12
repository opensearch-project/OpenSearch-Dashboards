/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HttpResponsePayload,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';

/**
 * @experimental this class is experimental and might change in future releases.
 */
export abstract class BaseConnectionManager {
  constructor() {}

  abstract handlePostRequest(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest
  ): Promise<HttpResponsePayload>;
}
