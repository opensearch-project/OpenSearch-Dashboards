/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { stringify } from 'query-string';
import rison from 'rison-node';
import { BehaviorSubject } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import {
  App,
  AppMountParameters,
  AppUpdater,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_GROUPS,
  isNavGroupInFeatureConfigs,
  Plugin,
  PluginInitializerContext,
  ScopedHistory,
  WorkspaceAvailability,
} from '../../../core/public';
import {
  createOsdUrlStateStorage,
  createOsdUrlTracker,
  url,
  withNotifyOnErrors,
} from '../../opensearch_dashboards_utils/public';
import { ExploreFlavor, PLUGIN_ID, PLUGIN_NAME } from '../common';
import { ConfigSchema } from '../common/config';
import { generateDocViewsUrl } from './application/legacy/discover/application/components/doc_views/generate_doc_views_url';
import { DocViewsLinksRegistry } from './application/legacy/discover/application/doc_views_links/doc_views_links_registry';
import {
  getServices,
  setDocViewsLinksRegistry,
  setDocViewsRegistry,
  setServices as setLegacyServices,
  setUiActions,
  setExpressionLoader,
  setDashboard,
  setDashboardVersion,
} from './application/legacy/discover/opensearch_dashboards_services';
import { getPreloadedStore } from './application/utils/state_management/store';
import { buildServices } from './build_services';
import { DocViewTable } from './components/doc_viewer/doc_viewer_table/table';
import { JsonCodeBlock } from './components/doc_viewer/json_code_block/json_code_block';
import {
  createQueryEditorExtensionConfig,
  SHOW_CLASSIC_DISCOVER_LOCAL_STORAGE_KEY,
} from './components/experience_banners';
import { createSavedExploreLoader } from './saved_explore';
import { TabRegistryService } from './services/tab_registry/tab_registry_service';
import { setUsageCollector } from './services/usage_collector';
import { VisualizationRegistryService } from './services/visualization_registry_service';
import {
  ExplorePluginSetup,
  ExplorePluginStart,
  ExploreSetupDependencies,
  ExploreStartDependencies,
} from './types';
import { DocViewsRegistry } from './types/doc_views_types';
import { ExploreEmbeddableFactory } from './embeddable';
import { SAVED_OBJECT_TYPE } from './saved_explore/_saved_explore';
import { DASHBOARD_ADD_PANEL_TRIGGER } from '../../dashboard/public';
import { reactToUiComponent } from '../../opensearch_dashboards_react/public';
import { VisualizationActionMenuItem } from './helpers/visualization_action_menu';
import { ActionExecutionContext } from '../../ui_actions/public';

export class ExplorePlugin
  implements
    Plugin<
      ExplorePluginSetup,
      ExplorePluginStart,
      ExploreSetupDependencies,
      ExploreStartDependencies
    > {
  // @ts-ignore
  private config: ConfigSchema;
  private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  // FIXME set to false when integrate with dashboard assistant plugin
  private isSummaryAgentAvailable$ = new BehaviorSubject<boolean>(true);

  private stopUrlTracking?: () => void;
  private currentHistory?: ScopedHistory;
  private readonly DISCOVER_VISUALIZATION_NAME = 'DiscoverVisualization';

  /** discover */
  private docViewsRegistry: DocViewsRegistry | null = null;
  private docViewsLinksRegistry: DocViewsLinksRegistry | null = null;
  private servicesInitialized: boolean = false;
  private urlGenerator?: import('./types').ExplorePluginStart['urlGenerator'];
  private initializeServices?: () => { core: CoreStart; plugins: ExploreStartDependencies };

  // Add a new property for the tab registry
  private tabRegistry: TabRegistryService = new TabRegistryService();

  /** visualization registry */
  private visualizationRegistryService = new VisualizationRegistryService();

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
  }

  public setup(
    core: CoreSetup<ExploreStartDependencies, ExplorePluginStart>,
    setupDeps: ExploreSetupDependencies
  ): ExplorePluginSetup {
    // Set usage collector
    setUsageCollector(setupDeps.usageCollection);
    this.registerExploreVisualization(core, setupDeps);
    const visualizationRegistryService = this.visualizationRegistryService.setup();

    this.docViewsRegistry = new DocViewsRegistry();
    setDocViewsRegistry(this.docViewsRegistry);
    this.docViewsRegistry.addDocView({
      title: i18n.translate('explore.discover.docViews.table.tableTitle', {
        defaultMessage: 'Table',
      }),
      order: 10,
      component: DocViewTable,
    });

    this.docViewsRegistry.addDocView({
      title: i18n.translate('explore.discover.docViews.json.jsonTitle', {
        defaultMessage: 'JSON',
      }),
      order: 20,
      component: JsonCodeBlock,
    });
    this.docViewsLinksRegistry = new DocViewsLinksRegistry();
    setDocViewsLinksRegistry(this.docViewsLinksRegistry);

    this.docViewsLinksRegistry.addDocViewLink({
      label: i18n.translate('explore.discover.docTable.tableRow.viewSurroundingDocumentsLinkText', {
        defaultMessage: 'View surrounding documents',
      }),
      generateCb: (renderProps: Record<string, unknown>) => {
        const queryString = getServices().data.query.queryString;
        const showDocLinks =
          queryString.getLanguageService().getLanguage(queryString.getQuery().language)
            ?.showDocLinks ?? undefined;

        // Note: Explore uses Redux for filter management, not filterManager
        // So we don't include filter state in URLs for context links
        const hash = stringify(
          url.encodeQuery({
            _g: rison.encode({}), // No global filters (explore uses Redux)
            _a: rison.encode({
              columns: (renderProps as any).columns,
              // No filters since explore uses Redux store instead of filterManager
            }),
          }),
          { encode: false, sort: false }
        );

        const contextUrl = `#/context/${encodeURIComponent(
          (renderProps as any).indexPattern.id
        )}/${encodeURIComponent((renderProps as any).hit._id)}?${hash}`;

        return {
          url: generateDocViewsUrl(contextUrl),
          hide:
            (showDocLinks !== undefined ? !showDocLinks : false) ||
            !(renderProps as any).indexPattern.isTimeBased(),
        };
      },
      order: 1,
    });

    this.docViewsLinksRegistry.addDocViewLink({
      label: i18n.translate('explore.discover.docTable.tableRow.viewSingleDocumentLinkText', {
        defaultMessage: 'View single document',
      }),
      generateCb: (renderProps) => {
        const queryString = getServices().data.query.queryString;
        const showDocLinks =
          queryString.getLanguageService().getLanguage(queryString.getQuery().language)
            ?.showDocLinks ?? undefined;

        const docUrl = `#/doc/${renderProps.indexPattern.id}/${
          renderProps.hit._index
        }?id=${encodeURIComponent(renderProps.hit._id)}`;

        return {
          url: generateDocViewsUrl(docUrl),
          hide: showDocLinks !== undefined ? !showDocLinks : false,
        };
      },
      order: 2,
    });

    const { appMounted, appUnMounted, stop: stopUrlTracker } = createOsdUrlTracker({
      baseUrl: core.http.basePath.prepend(`/app/${PLUGIN_ID}`),
      defaultSubUrl: '#/',
      storageKey: `lastUrl:${core.http.basePath.get()}:${PLUGIN_ID}`,
      navLinkUpdater$: this.appStateUpdater,
      toastNotifications: core.notifications.toasts,
      stateParams: [
        {
          osdUrlKey: '_g',
          stateUpdate$: setupDeps.data.query.state$.pipe(
            filter(
              (value: Record<string, unknown>) =>
                !!((value.changes as any)?.time || (value.changes as any)?.refreshInterval)
            ),
            map((value: Record<string, unknown>) => ({
              ...(value.state as Record<string, unknown>),
              // Note: We don't use data plugin's filterManager, filters are managed in Redux
            }))
          ),
        },
      ],
      getHistory: () => {
        return this.currentHistory!;
      },
    });
    this.stopUrlTracking = () => {
      stopUrlTracker();
    };

    setupDeps.data.__enhance({
      editor: {
        queryEditorExtension: createQueryEditorExtensionConfig(core),
      },
    });

    const createExploreApp = (flavor?: ExploreFlavor, options: Partial<App> = {}): App => ({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      updater$: this.appStateUpdater.asObservable(),
      order: 1000,
      workspaceAvailability: WorkspaceAvailability.insideWorkspace,
      euiIconType: 'inputOutput',
      defaultPath: '#/',
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      mount: async (params: AppMountParameters) => {
        if (!this.initializeServices) {
          throw Error('Explore plugin method initializeServices is undefined');
        }

        // Get start services
        const { core: coreStart, plugins: pluginsStart } = await this.initializeServices();
        const isExploreEnabledWorkspace = this.getIsExploreEnabledWorkspace(coreStart);
        // We want to limit explore UI to only show up under the explore-enabled
        // workspaces. If user lands in the explore plugin URL in a different
        // workspace, we will redirect them to classic discover. We will also redirect if
        // they have manually selected classic discover
        if (
          !isExploreEnabledWorkspace ||
          !!localStorage.getItem(SHOW_CLASSIC_DISCOVER_LOCAL_STORAGE_KEY)
        ) {
          coreStart.application.navigateToApp('discover', { replace: true });
          return () => {};
        }

        // If there's no flavor id, by default redirect to the logs flavor.
        if (!flavor) {
          coreStart.application.navigateToApp(`${PLUGIN_ID}/${ExploreFlavor.Logs}`, {
            replace: true,
          });
          return () => {};
        }

        this.currentHistory = params.history;

        // make sure the index pattern list is up to date
        pluginsStart.data.indexPatterns.clearCache();

        // Check if this is a context or doc route (following discover pattern)
        const path = window.location.hash;
        if (path.startsWith('#/context') || path.startsWith('#/doc')) {
          const { renderDocView } = await import(
            './application/legacy/discover/application/components/doc_views'
          );
          const unmount = renderDocView(params.element);
          return () => {
            unmount();
          };
        }

        // For main explore routes, load the full application
        const { renderApp } = await import('./application');
        const { registerTabs } = await import('./application/register_tabs');

        // Build services using the buildServices function
        const services = buildServices(
          coreStart,
          pluginsStart,
          this.initializerContext,
          this.tabRegistry,
          this.visualizationRegistryService,
          this.isSummaryAgentAvailable$
        );

        // Add osdUrlStateStorage to services (like VisBuilder and DataExplorer)
        services.osdUrlStateStorage = createOsdUrlStateStorage({
          history: this.currentHistory,
          useHash: coreStart.uiSettings.get('state:storeInSessionStorage'),
          ...withNotifyOnErrors(coreStart.notifications.toasts),
        });

        // Add scopedHistory to services
        services.scopedHistory = this.currentHistory;

        // Register tabs with the tab registry
        registerTabs(services);

        // Instantiate the store
        const { store, unsubscribe: unsubscribeStore } = await getPreloadedStore(services);
        services.store = store;

        appMounted();

        // Call renderApp with params, services, and store
        const unmount = renderApp(params, services, store, flavor);

        return () => {
          appUnMounted();
          unmount();
          unsubscribeStore();
        };
      },
      ...options,
    });

    // Register applications into the side navigation menu
    core.application.register(
      createExploreApp(ExploreFlavor.Logs, {
        id: `${PLUGIN_ID}/${ExploreFlavor.Logs}`,
        title: 'Logs',
      })
    );
    core.application.register(
      createExploreApp(ExploreFlavor.Traces, {
        id: `${PLUGIN_ID}/${ExploreFlavor.Traces}`,
        title: 'Traces',
      })
    );
    core.application.register(
      createExploreApp(ExploreFlavor.Metrics, {
        id: `${PLUGIN_ID}/${ExploreFlavor.Metrics}`,
        title: 'Metrics',
      })
    );
    core.application.register(createExploreApp());

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 300,
      },
      {
        id: `${PLUGIN_ID}/${ExploreFlavor.Logs}`,
        category: undefined,
        order: 300,
        parentNavLinkId: PLUGIN_ID,
      },
      {
        id: `${PLUGIN_ID}/${ExploreFlavor.Traces}`,
        category: undefined,
        order: 300,
        parentNavLinkId: PLUGIN_ID,
      },
      {
        id: `${PLUGIN_ID}/${ExploreFlavor.Metrics}`,
        category: undefined,
        order: 300,
        parentNavLinkId: PLUGIN_ID,
      },
    ]);
    this.registerEmbeddable(core, setupDeps);

    setupDeps.urlForwarding.forwardApp('doc', PLUGIN_ID, (path) => {
      return `#${path}`;
    });
    setupDeps.urlForwarding.forwardApp('context', PLUGIN_ID, (path) => {
      const urlParts = path.split('/');
      // take care of urls containing legacy url, those split in the following way
      // ["", "context", indexPatternId, _type, id + params]
      if (urlParts[4]) {
        // remove _type part
        const newPath = [...urlParts.slice(0, 3), ...urlParts.slice(4)].join('/');
        return `#${newPath}`;
      }
      return `#${path}`;
    });
    setupDeps.urlForwarding.forwardApp('discover', PLUGIN_ID, (path) => {
      const [, id, tail] = /discover\/([^\?]+)(.*)/.exec(path) || [];
      if (!id) {
        return `#${path.replace('/discover', '') || '/'}`;
      }
      return `#/view/${id}${tail || ''}`;
    });

    /* if (setupDeps.home) {
      registerFeature(setupDeps.home);
    } */

    return {
      docViews: {
        addDocView: (docViewSpec: unknown) => this.docViewsRegistry?.addDocView(docViewSpec as any),
      },
      docViewsLinks: {
        addDocViewLink: (docViewLinkSpec: unknown) =>
          this.docViewsLinksRegistry?.addDocViewLink(docViewLinkSpec as any),
      },
      visualizationRegistry: visualizationRegistryService,
      isSummaryAgentAvailable$: this.isSummaryAgentAvailable$,
    };
  }

  public start(core: CoreStart, plugins: ExploreStartDependencies): ExplorePluginStart {
    setUiActions(plugins.uiActions);
    setDashboard(plugins.dashboard);
    const opensearchDashboardsVersion = this.initializerContext.env.packageInfo.version;
    setDashboardVersion({ version: opensearchDashboardsVersion });

    if (plugins.expressions) {
      setExpressionLoader(plugins.expressions.ExpressionLoader);
    }

    this.initializeServices = () => {
      if (this.servicesInitialized) {
        return { core, plugins };
      }
      const services = buildServices(
        core,
        plugins,
        this.initializerContext,
        this.tabRegistry,
        this.visualizationRegistryService,
        this.isSummaryAgentAvailable$
      );
      setLegacyServices({
        ...services,
        visualizationRegistry: this.visualizationRegistryService,
      });
      this.servicesInitialized = true;

      return { core, plugins };
    };

    this.initializeServices();

    const savedExploreLoader = createSavedExploreLoader({
      savedObjectsClient: core.savedObjects.client,
      indexPatterns: plugins.data.indexPatterns,
      search: plugins.data.search,
      chrome: core.chrome,
      overlays: core.overlays,
    });

    return {
      urlGenerator: this.urlGenerator,
      savedSearchLoader: savedExploreLoader, // For backward compatibility
      savedExploreLoader,
      visualizationRegistry: this.visualizationRegistryService.start(),
    };
  }

  public stop() {
    if (this.stopUrlTracking) {
      this.stopUrlTracking();
    }
  }

  private registerEmbeddable(
    core: CoreSetup<ExploreStartDependencies>,
    plugins: ExploreSetupDependencies
  ) {
    const getStartServices = async () => {
      const [coreStart, deps] = await core.getStartServices();
      return {
        executeTriggerActions: deps.uiActions.executeTriggerActions,
        isEditable: () => coreStart.application.capabilities.discover?.save as boolean,
      };
    };

    const factory = new ExploreEmbeddableFactory(
      getStartServices,
      this.visualizationRegistryService
    );
    plugins.embeddable.registerEmbeddableFactory(factory.type, factory);
  }

  private async registerExploreVisualization(
    core: CoreSetup<ExploreStartDependencies, ExplorePluginStart>,
    setupDeps: ExploreSetupDependencies
  ) {
    const exploreVisDisplayName = i18n.translate('explore.visualization.title', {
      defaultMessage: 'Visualize with Discover',
    });
    // Register explore visualization as visualization alias
    setupDeps.visualizations.registerAlias({
      name: this.DISCOVER_VISUALIZATION_NAME,
      aliasPath: '#/',
      aliasApp: PLUGIN_ID,
      title: exploreVisDisplayName,
      description: i18n.translate('explore.visualization.description', {
        defaultMessage: 'Create visualization with Discover',
      }),
      icon: 'visualizeApp',
      stage: 'production',
      // We only want explore visualization type avaialble for observability
      // type of workspace, so make it as hidden initially
      hidden: true,
      appExtensions: {
        visualizations: {
          docTypes: [SAVED_OBJECT_TYPE],
          toListItem: ({ id, attributes, updated_at: updatedAt }) => {
            let iconType = '';
            let chartName = '';
            try {
              const vis = JSON.parse(attributes.visualization as string);
              const chart = this.visualizationRegistryService
                .getRegistry()
                .getAvailableChartTypes()
                .find((t) => t.type === vis.chartType);
              if (chart) {
                iconType = chart.icon;
                chartName = chart.name;
              }
            } catch (e) {
              iconType = '';
            }
            return {
              description: `${attributes?.description || ''}`,
              // TODO: it should navigate to different explore flavor based on the `attributes.type`
              editApp: `${PLUGIN_ID}/${ExploreFlavor.Logs}`,
              editUrl: `#/view/${encodeURIComponent(id)}`,
              icon: iconType,
              id,
              savedObjectType: SAVED_OBJECT_TYPE,
              title: `${attributes?.title || ''}`,
              typeTitle: chartName,
              updated_at: updatedAt,
              stage: 'production',
            };
          },
        },
      },
    });

    const [coreStart, pluginsStart] = await core.getStartServices();
    const isExploreEnabledWorkspace = await this.getIsExploreEnabledWorkspace(coreStart);
    if (isExploreEnabledWorkspace) {
      const registeredVisAlias = pluginsStart.visualizations
        .getAliases()
        .find((v) => v.name === this.DISCOVER_VISUALIZATION_NAME);

      // if current workspace has explore enabled, the explore visualization ingress should be not hidden
      if (registeredVisAlias) {
        registeredVisAlias.hidden = false;
      }

      // Register explore visualization to dashboard add vis panel list
      pluginsStart.uiActions.addTriggerAction(DASHBOARD_ADD_PANEL_TRIGGER, {
        id: `add_vis_action_explore`,
        getIconType: () => 'visualizeApp',
        order: 1,
        MenuItem: reactToUiComponent<{ onClick: () => void; context: ActionExecutionContext }>(
          (props) =>
            React.createElement(VisualizationActionMenuItem, {
              exploreVisDisplayName,
              onClick: () => {
                props.onClick();
              },
            })
        ),
        execute: async () => {
          coreStart.application.navigateToApp(`${PLUGIN_ID}/${ExploreFlavor.Logs}`, {
            replace: true,
          });
        },
      });
    }
  }

  private async getIsExploreEnabledWorkspace(core: CoreStart) {
    const features = await core.workspaces.currentWorkspace$
      .pipe(take(1))
      .toPromise()
      .then((workspace) => workspace?.features);
    return (
      (features && isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS.observability.id, features)) ??
      false
    );
  }
}
