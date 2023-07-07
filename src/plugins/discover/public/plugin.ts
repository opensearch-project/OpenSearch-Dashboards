/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import {
  AppMountParameters,
  AppUpdater,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from 'opensearch-dashboards/public';
import { UiActionsStart, UiActionsSetup } from 'src/plugins/ui_actions/public';
import { EmbeddableStart, EmbeddableSetup } from 'src/plugins/embeddable/public';
import { ChartsPluginStart } from 'src/plugins/charts/public';
import { NavigationPublicPluginStart as NavigationStart } from 'src/plugins/navigation/public';
import { SharePluginStart, SharePluginSetup, UrlGeneratorContract } from 'src/plugins/share/public';
import { VisualizationsStart, VisualizationsSetup } from 'src/plugins/visualizations/public';
import {
  OpenSearchDashboardsLegacySetup,
  OpenSearchDashboardsLegacyStart,
} from 'src/plugins/opensearch_dashboards_legacy/public';
import { UrlForwardingSetup, UrlForwardingStart } from 'src/plugins/url_forwarding/public';
import { HomePublicPluginSetup } from 'src/plugins/home/public';
import { Start as InspectorPublicPluginStart } from 'src/plugins/inspector/public';
import { stringify } from 'query-string';
import rison from 'rison-node';
import { DataPublicPluginStart, DataPublicPluginSetup, opensearchFilters } from '../../data/public';
import { SavedObjectLoader } from '../../saved_objects/public';
import { createOsdUrlTracker, url } from '../../opensearch_dashboards_utils/public';
import { DEFAULT_APP_CATEGORIES } from '../../../core/public';
import { UrlGeneratorState } from '../../share/public';
import { DocViewInput, DocViewInputFn } from './application/doc_views/doc_views_types';
import { DocViewLink } from './application/doc_views_links/doc_views_links_types';
import { DocViewsRegistry } from './application/doc_views/doc_views_registry';
import { DocViewsLinksRegistry } from './application/doc_views_links/doc_views_links_registry';
import { DocViewTable } from './application/components/table/table';
import { JsonCodeBlock } from './application/components/json_code_block/json_code_block';
import {
  setDocViewsRegistry,
  setDocViewsLinksRegistry,
  setUrlTracker,
  setServices,
  setHeaderActionMenuMounter,
  setUiActions,
  setScopedHistory,
  getScopedHistory,
  syncHistoryLocations,
  getServices,
} from './opensearch_dashboards_services';
import { createSavedSearchesLoader } from './saved_searches';
import { buildServices } from './build_services';
import {
  DiscoverUrlGeneratorState,
  DISCOVER_APP_URL_GENERATOR,
  DiscoverUrlGenerator,
} from './url_generator';
// import { SearchEmbeddableFactory } from './application/embeddable';
import { DISCOVER_LEGACY_TOGGLE, PLUGIN_ID } from '../common';
import { DataExplorerPluginSetup, ViewRedirectParams } from '../../data_explorer/public';
import { registerFeature } from './register_feature';

declare module '../../share/public' {
  export interface UrlGeneratorStateMapping {
    [DISCOVER_APP_URL_GENERATOR]: UrlGeneratorState<DiscoverUrlGeneratorState>;
  }
}

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

export interface DiscoverStart {
  savedSearchLoader: SavedObjectLoader;

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
  readonly urlGenerator: undefined | UrlGeneratorContract<'DISCOVER_APP_URL_GENERATOR'>;
}

/**
 * @internal
 */
export interface DiscoverSetupPlugins {
  share?: SharePluginSetup;
  uiActions: UiActionsSetup;
  embeddable: EmbeddableSetup;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacySetup;
  urlForwarding: UrlForwardingSetup;
  home?: HomePublicPluginSetup;
  visualizations: VisualizationsSetup;
  data: DataPublicPluginSetup;
  dataExplorer: DataExplorerPluginSetup;
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

const embeddableAngularName = 'app/discoverEmbeddable';

/**
 * Contains Discover, one of the oldest parts of OpenSearch Dashboards
 * There are 2 kinds of Angular bootstrapped for rendering, additionally to the main Angular
 * Discover provides embeddables, those contain a slimmer Angular
 */
export class DiscoverPlugin
  implements Plugin<DiscoverSetup, DiscoverStart, DiscoverSetupPlugins, DiscoverStartPlugins> {
  constructor(private readonly initializerContext: PluginInitializerContext) {}

  private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private docViewsRegistry: DocViewsRegistry | null = null;
  private docViewsLinksRegistry: DocViewsLinksRegistry | null = null;
  private stopUrlTracking: (() => void) | undefined = undefined;
  private servicesInitialized: boolean = false;
  private urlGenerator?: DiscoverStart['urlGenerator'];
  private initializeServices?: () => Promise<{ core: CoreStart; plugins: DiscoverStartPlugins }>;

  setup(core: CoreSetup<DiscoverStartPlugins, DiscoverStart>, plugins: DiscoverSetupPlugins) {
    const baseUrl = core.http.basePath.prepend('/app/discover');

    if (plugins.share) {
      this.urlGenerator = plugins.share.urlGenerators.registerUrlGenerator(
        new DiscoverUrlGenerator({
          appBasePath: baseUrl,
          useHash: core.uiSettings.get('state:storeInSessionStorage'),
        })
      );
    }

    this.docViewsRegistry = new DocViewsRegistry();
    setDocViewsRegistry(this.docViewsRegistry);
    this.docViewsRegistry.addDocView({
      title: i18n.translate('discover.docViews.table.tableTitle', {
        defaultMessage: 'Table',
      }),
      order: 10,
      component: DocViewTable,
    });

    this.docViewsRegistry.addDocView({
      title: i18n.translate('discover.docViews.json.jsonTitle', {
        defaultMessage: 'JSON',
      }),
      order: 20,
      component: JsonCodeBlock,
    });

    this.docViewsLinksRegistry = new DocViewsLinksRegistry();
    setDocViewsLinksRegistry(this.docViewsLinksRegistry);

    this.docViewsLinksRegistry.addDocViewLink({
      label: i18n.translate('discover.docTable.tableRow.viewSurroundingDocumentsLinkText', {
        defaultMessage: 'View surrounding documents',
      }),
      generateCb: (renderProps: any) => {
        const globalFilters: any = getServices().filterManager.getGlobalFilters();
        const appFilters: any = getServices().filterManager.getAppFilters();

        const hash = stringify(
          url.encodeQuery({
            _g: rison.encode({
              filters: globalFilters || [],
            }),
            _a: rison.encode({
              columns: renderProps.columns,
              filters: (appFilters || []).map(opensearchFilters.disableFilter),
            }),
          }),
          { encode: false, sort: false }
        );

        return {
          url: `#/context/${encodeURIComponent(renderProps.indexPattern.id)}/${encodeURIComponent(
            renderProps.hit._id
          )}?${hash}`,
          hide: !renderProps.indexPattern.isTimeBased(),
        };
      },
      order: 1,
    });

    this.docViewsLinksRegistry.addDocViewLink({
      label: i18n.translate('discover.docTable.tableRow.viewSingleDocumentLinkText', {
        defaultMessage: 'View single document',
      }),
      generateCb: (renderProps) => ({
        url: `#/doc/${renderProps.indexPattern.id}/${
          renderProps.hit._index
        }?id=${encodeURIComponent(renderProps.hit._id)}`,
      }),
      order: 2,
    });

    const {
      appMounted,
      appUnMounted,
      stop: stopUrlTracker,
      setActiveUrl: setTrackedUrl,
      restorePreviousUrl,
    } = createOsdUrlTracker({
      // we pass getter here instead of plain `history`,
      // so history is lazily created (when app is mounted)
      // this prevents redundant `#` when not in discover app
      getHistory: getScopedHistory,
      baseUrl,
      defaultSubUrl: '#/',
      storageKey: `lastUrl:${core.http.basePath.get()}:discover`,
      navLinkUpdater$: this.appStateUpdater,
      toastNotifications: core.notifications.toasts,
      stateParams: [
        {
          osdUrlKey: '_g',
          stateUpdate$: plugins.data.query.state$.pipe(
            filter(
              ({ changes }) => !!(changes.globalFilters || changes.time || changes.refreshInterval)
            ),
            map(({ state }) => ({
              ...state,
              filters: state.filters?.filter(opensearchFilters.isFilterPinned),
            }))
          ),
        },
      ],
    });
    setUrlTracker({ setTrackedUrl, restorePreviousUrl });
    this.stopUrlTracking = () => {
      stopUrlTracker();
    };

    core.application.register({
      id: PLUGIN_ID,
      title: 'Discover',
      updater$: this.appStateUpdater.asObservable(),
      order: 1000,
      euiIconType: 'inputOutput',
      defaultPath: '#/',
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      mount: async (params: AppMountParameters) => {
        if (!this.initializeServices) {
          throw Error('Discover plugin method initializeServices is undefined');
        }
        setScopedHistory(params.history);
        setHeaderActionMenuMounter(params.setHeaderActionMenu);
        syncHistoryLocations();
        appMounted();
        const {
          core: {
            application: { navigateToApp },
          },
        } = await this.initializeServices();

        const path = window.location.hash;
        const enableLegacyMode = await core.uiSettings.get<boolean>(DISCOVER_LEGACY_TOGGLE);
        if (enableLegacyMode) {
          navigateToApp('discoverLegacy', {
            replace: true,
            path,
          });
        } else {
          navigateToApp('data-explorer', {
            replace: true,
            path: `/${PLUGIN_ID}`,
            state: {
              path,
            } as ViewRedirectParams,
          });
        }

        // TODO: Carry this over to the view
        // make sure the index pattern list is up to date
        // await dataStart.indexPatterns.clearCache();
        return () => {
          appUnMounted();
        };
      },
    });

    // TODO: These routes need to be handled for Discover 2.0 to support legacy saved URLS's
    // plugins.urlForwarding.forwardApp('doc', 'discover', (path) => {
    //   return `#${path}`;
    // });
    // plugins.urlForwarding.forwardApp('context', 'discover', (path) => {
    //   const urlParts = path.split('/');
    //   // take care of urls containing legacy url, those split in the following way
    //   // ["", "context", indexPatternId, _type, id + params]
    //   if (urlParts[4]) {
    //     // remove _type part
    //     const newPath = [...urlParts.slice(0, 3), ...urlParts.slice(4)].join('/');
    //     return `#${newPath}`;
    //   }
    //   return `#${path}`;
    // });
    // plugins.urlForwarding.forwardApp('discover', 'discover', (path) => {
    //   const [, id, tail] = /discover\/([^\?]+)(.*)/.exec(path) || [];
    //   if (!id) {
    //     return `#${path.replace('/discover', '') || '/'}`;
    //   }
    //   return `#/view/${id}${tail || ''}`;
    // });

    if (plugins.home) {
      registerFeature(plugins.home);
    }

    plugins.dataExplorer.registerView({
      id: PLUGIN_ID,
      title: 'Discover',
      defaultPath: '#/',
      appExtentions: {
        savedObject: {
          docTypes: ['search'],
          toListItem: (obj) => ({
            id: obj.id,
            label: obj.title,
          }),
        },
      },
      ui: {
        defaults: {},
        reducer: () => ({}),
      },
      shouldShow: () => true,
      mount: async (params) => {
        const { renderCanvas, renderPanel } = await import('./application/view_components');
        const [coreStart, pluginsStart] = await core.getStartServices();
        const services = await buildServices(coreStart, pluginsStart, this.initializerContext);

        renderCanvas(params, services);
        renderPanel(params, services);

        return () => {};
      },
    });

    // this.registerEmbeddable(core, plugins);

    return {
      docViews: {
        addDocView: this.docViewsRegistry.addDocView.bind(this.docViewsRegistry),
      },
      docViewsLinks: {
        addDocViewLink: this.docViewsLinksRegistry.addDocViewLink.bind(this.docViewsLinksRegistry),
      },
    };
  }

  start(core: CoreStart, plugins: DiscoverStartPlugins) {
    setUiActions(plugins.uiActions);

    this.initializeServices = async () => {
      if (this.servicesInitialized) {
        return { core, plugins };
      }
      const services = await buildServices(core, plugins, this.initializerContext);
      setServices(services);
      this.servicesInitialized = true;

      return { core, plugins };
    };

    return {
      urlGenerator: this.urlGenerator,
      savedSearchLoader: createSavedSearchesLoader({
        savedObjectsClient: core.savedObjects.client,
        indexPatterns: plugins.data.indexPatterns,
        search: plugins.data.search,
        chrome: core.chrome,
        overlays: core.overlays,
      }),
    };
  }

  stop() {
    if (this.stopUrlTracking) {
      this.stopUrlTracking();
    }
  }

  // TODO: Use this registration when legacy discover is removed
  /**
   * register embeddable with a slimmer embeddable version of inner angular
   */
  private registerEmbeddable(core: CoreSetup<DiscoverStartPlugins>, plugins: DiscoverSetupPlugins) {
    const getStartServices = async () => {
      const [coreStart, deps] = await core.getStartServices();
      return {
        executeTriggerActions: deps.uiActions.executeTriggerActions,
        isEditable: () => coreStart.application.capabilities.discover.save as boolean,
      };
    };

    // TODO: Refactor to remove angular
    // const factory = new SearchEmbeddableFactory(getStartServices, this.getEmbeddableInjector);
    // plugins.embeddable.registerEmbeddableFactory(factory.type, factory);
  }
}
