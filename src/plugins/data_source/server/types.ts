/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from 'src/core/server';

export interface DataSourcePluginRequestContext {
  opensearch: {
    getClient: (dataSourceId: string) => Promise<OpenSearchClient>;
  };
}
declare module 'src/core/server' {
  interface RequestHandlerContext {
    data_source: DataSourcePluginRequestContext;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataSourcePluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataSourcePluginStart {}
