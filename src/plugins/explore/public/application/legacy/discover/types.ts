/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UiActionsStart } from '../../../../../ui_actions/public';
import { EmbeddableStart } from '../../../../../embeddable/public';
import { ChartsPluginStart } from '../../../../../charts/public';
import { NavigationPublicPluginStart as NavigationStart } from '../../../../../navigation/public';
import { SharePluginStart, UrlGeneratorContract } from '../../../../../share/public';
import { VisualizationsStart } from '../../../../../visualizations/public';
import { OpenSearchDashboardsLegacyStart } from '../../../../../opensearch_dashboards_legacy/public';
import { UrlForwardingStart } from '../../../../../url_forwarding/public';
import { Start as InspectorPublicPluginStart } from '../../../../../inspector/public';
import { DataPublicPluginStart } from '../../../../../data/public';
import { SavedObjectLoader } from '../../../../../saved_objects/public';
import { DocViewInput, DocViewInputFn } from './application/doc_views/doc_views_types';
import { DocViewLink } from './application/doc_views_links/doc_views_links_types';

/**
 * @public
 */
export interface DiscoverSetup {
  docViews: {
    /**
     * Add new doc view shown along with table view and json view in the details of each document in Discover.
     * @param docViewRaw
     */
    addDocView(docViewRaw: DocViewInput | DocViewInputFn): void;
  };

  docViewsLinks: {
    addDocViewLink(docViewLinkRaw: DocViewLink): void;
  };
}

export interface ExploreStart {
  savedExploreLoader: SavedObjectLoader;

  /**
   * `share` plugin URL generator for Discover app. Use it to generate links into
   * Discover application, example:
   *
   * ```ts
   * const url = await plugins.discover.urlGenerator.createUrl({
   *   savedSearchId: '571aaf70-4c88-11e8-b3d7-01146121b73d',
   *   indexPatternId: 'c367b774-a4c2-11ea-bb37-0242ac130002',
   *   timeRange: {
   *     to: 'now',
   *     from: 'now-15m',
   *     mode: 'relative',
   *   },
   * });
   * ```
   */
  readonly urlGenerator: undefined | UrlGeneratorContract<'EXPLORE_APP_URL_GENERATOR'>;
}

/**
 * @internal
 */
export interface DiscoverStartPlugins {
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
