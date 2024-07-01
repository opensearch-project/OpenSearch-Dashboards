/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDynamicConfigStoreClientFactory } from 'opensearch-dashboards/server';
import { OpenSearchConfigStoreClient } from './opensearch_config_store_client';

export class OpenSearchDynamicConfigStoreFactory implements IDynamicConfigStoreClientFactory {
  /**
   * TODO Once the OpenSearch client is implemented, finish implementing factory method
   */
  public create() {
    return new OpenSearchConfigStoreClient();
  }
}
