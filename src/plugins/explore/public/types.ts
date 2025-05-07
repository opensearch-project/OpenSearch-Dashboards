/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginSetup, DataPublicPluginStart } from 'src/plugins/data/public';
import { DataExplorerPluginSetup } from 'src/plugins/data_explorer/public';
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
import { UsageCollectionSetup } from 'src/plugins/usage_collection/server';
import { VisualizationsSetup, VisualizationsStart } from 'src/plugins/visualizations/public';
import { ChartsPluginStart } from 'src/plugins/charts/public';
import { NavigationPublicPluginStart as NavigationStart } from '../../navigation/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExplorePluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExplorePluginStart {}

/**
 * @internal
 */
export interface ExploreSetupPlugins {
  navigation: NavigationStart;
  share?: SharePluginSetup;
  uiActions: UiActionsSetup;
  embeddable: EmbeddableSetup;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacySetup;
  urlForwarding: UrlForwardingSetup;
  home?: HomePublicPluginSetup;
  visualizations: VisualizationsSetup;
  data: DataPublicPluginSetup;
  dataExplorer: DataExplorerPluginSetup;
  usageCollection: UsageCollectionSetup;
}

/**
 * @internal
 */
export interface ExploreStartPlugins {
  uiActions: UiActionsStart;
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
