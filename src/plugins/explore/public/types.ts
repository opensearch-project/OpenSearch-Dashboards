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
import { ExpressionsPublicPlugin, ExpressionsStart } from 'src/plugins/expressions/public';
import { NavigationPublicPluginStart as NavigationStart } from '../../navigation/public';
import { DataExplorerPluginSetup } from './application/legacy/data_explorer';
import {
  VisualizationRegistryServiceSetup,
  VisualizationRegistryServiceStart,
} from './services/visualization_registry_service';

export interface ExplorePluginSetup {
  /**
   * Visualization registry service for registering visualization rules
   */
  visualizationRegistry: VisualizationRegistryServiceSetup;

  /**
   * Doc views registry for registering doc views
   */
  docViews: {
    addDocView: any;
  };

  /**
   * Doc views links registry for registering doc view links
   */
  docViewsLinks: {
    addDocViewLink: any;
  };
}

export interface ExplorePluginStart {
  /**
   * Visualization registry service for registering visualization rules
   */
  visualizationRegistry: VisualizationRegistryServiceStart;

  /**
   * Saved explore loader
   */
  savedExploreLoader: any;

  /**
   * URL generator
   */
  urlGenerator?: any;
}

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
  dataExplorer: DataExplorerPluginSetup;
  usageCollection: UsageCollectionSetup;
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
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
