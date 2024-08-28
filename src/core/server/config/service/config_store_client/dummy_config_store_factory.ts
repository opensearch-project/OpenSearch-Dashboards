/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDynamicConfigStoreClientFactory } from 'opensearch-dashboards/server';
import { DummyConfigStoreClient } from './dummy_config_store_client';

export class DummyDynamicConfigStoreFactory implements IDynamicConfigStoreClientFactory {
  public create() {
    return new DummyConfigStoreClient();
  }
}
