/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup } from 'opensearch-dashboards/public';

export interface FetchDataFrameContext {
  http: CoreSetup['http'];
  path: string;
  signal?: AbortSignal;
}
