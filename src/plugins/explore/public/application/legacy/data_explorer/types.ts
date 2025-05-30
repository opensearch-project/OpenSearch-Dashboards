/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart, ScopedHistory } from 'opensearch-dashboards/public';
import { EmbeddableStart } from '../../../../../embeddable/public';
import { ExpressionsStart } from '../../../../../expressions/public';
import { IOsdUrlStateStorage } from '../../../../../opensearch_dashboards_utils/public';
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../../../../data/public';
import { Store } from './utils/state_management';
import { UsageCollectionSetup } from '../../../../../usage_collection/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataExplorerPluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataExplorerPluginStart {}

export interface DataExplorerPluginSetupDependencies {
  data: DataPublicPluginSetup;
  usageCollection: UsageCollectionSetup;
}

export interface DataExplorerPluginStartDependencies {
  expressions: ExpressionsStart;
  embeddable: EmbeddableStart;
  data: DataPublicPluginStart;
}

export interface DataExplorerServices extends CoreStart {
  store?: Store;
  expressions: ExpressionsStart;
  embeddable: EmbeddableStart;
  data: DataPublicPluginStart;
  scopedHistory: ScopedHistory;
  osdUrlStateStorage: IOsdUrlStateStorage;
}
