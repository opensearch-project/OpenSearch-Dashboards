/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IDynamicConfigStoreClientFactory,
  OpenSearchServiceStart,
} from 'opensearch-dashboards/server';
import { OpenSearchClient } from '../../../opensearch';
import { OpenSearchConfigStoreClient } from './opensearch_config_store_client';

export class OpenSearchDynamicConfigStoreFactory implements IDynamicConfigStoreClientFactory {
  readonly #opensearchClient: OpenSearchClient;

  constructor(opensearch: OpenSearchServiceStart) {
    this.#opensearchClient = opensearch.client.asInternalUser;
  }

  /**
   * TODO Once the OpenSearch client is implemented, finish implementing factory method
   */
  public create() {
    return new OpenSearchConfigStoreClient(this.#opensearchClient);
  }
}
