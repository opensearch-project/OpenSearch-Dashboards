/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChartsPluginStart } from 'src/plugins/charts/public';
import { DataPublicPluginSetup, DataPublicPluginStart } from 'src/plugins/data/public';
import { EmbeddableSetup, EmbeddableStart } from 'src/plugins/embeddable/public';
import { HomePublicPluginSetup } from 'src/plugins/home/public';
import { Start as InspectorPublicPluginStart } from 'src/plugins/inspector/public';
import {
  OpenSearchDashboardsLegacySetup,
  OpenSearchDashboardsLegacyStart,
} from 'src/plugins/opensearch_dashboards_legacy/public';
import { SharePluginSetup, SharePluginStart } from 'src/plugins/share/public';
import { UiActionsSetup, UiActionsStart } from 'src/plugins/ui_actions/public';
import { UrlForwardingSetup, UrlForwardingStart } from 'src/plugins/url_forwarding/public';
import { VisualizationsSetup, VisualizationsStart } from 'src/plugins/visualizations/public';
import { UsageCollectionSetup } from 'src/plugins/usage_collection/public';
import { ExpressionsStart } from 'src/plugins/expressions/public';
import { CoreStart, ScopedHistory } from 'opensearch-dashboards/public';
import { NavigationPublicPluginStart as NavigationStart } from '../../navigation/public';
import { IOsdUrlStateStorage } from '../../opensearch_dashboards_utils/public';
import { Store } from './utils/state_management';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExplorePluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExplorePluginStart {}

/**
 * @internal
 */
export interface ExploreSetupDependencies {
  navigation: NavigationStart;
  share?: SharePluginSetup;
  uiActions: UiActionsSetup;
  embeddable: EmbeddableSetup;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacySetup;
  urlForwarding: UrlForwardingSetup;
  home?: HomePublicPluginSetup;
  visualizations: VisualizationsSetup;
  data: DataPublicPluginSetup;
  usageCollection: UsageCollectionSetup;
}

/**
 * @internal
 */
export interface ExploreStartDependencies {
  uiActions: UiActionsStart;
  expressions: ExpressionsStart;
  embeddable: EmbeddableStart;
  navigation: NavigationStart;
  charts: ChartsPluginStart;
  data: DataPublicPluginStart;
  share?: SharePluginStart;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacyStart;
  urlForwarding: UrlForwardingStart;
  inspector: InspectorPublicPluginStart;
  visualizations: VisualizationsStart;
}

export interface DataExplorerServices extends CoreStart {
  store?: Store;
  expressions: ExpressionsStart;
  embeddable: EmbeddableStart;
  data: DataPublicPluginStart;
  scopedHistory: ScopedHistory;
  osdUrlStateStorage: IOsdUrlStateStorage;
}
