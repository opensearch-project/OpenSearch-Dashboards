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

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

import * as React from 'react';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

import { UrlForwardingSetup, UrlForwardingStart } from 'src/plugins/url_forwarding/public';
import { isEmpty } from 'lodash';
import { createHashHistory } from 'history';
import {
  App,
  AppMountParameters,
  AppUpdater,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  SavedObjectsClientContract,
  WorkspaceAvailability,
  ScopedHistory,
} from '../../../../src/core/public';
import { UsageCollectionSetup } from '../../usage_collection/public';
import {
  CONTEXT_MENU_TRIGGER,
  EmbeddableSetup,
  EmbeddableStart,
  SavedObjectEmbeddableInput,
  EmbeddableInput,
  PANEL_NOTIFICATION_TRIGGER,
} from '../../embeddable/public';
import { DataPublicPluginSetup, DataPublicPluginStart, opensearchFilters } from '../../data/public';
import { SharePluginSetup, SharePluginStart, UrlGeneratorContract } from '../../share/public';
import { UiActionsSetup, UiActionsStart } from '../../ui_actions/public';

import { Start as InspectorStartContract } from '../../inspector/public';
import { NavigationPublicPluginStart as NavigationStart } from '../../navigation/public';
import {
  getSavedObjectFinder,
  SavedObjectLoader,
  SavedObjectsStart,
  showSaveModal,
} from '../../saved_objects/public';
import {
  ExitFullScreenButton as ExitFullScreenButtonUi,
  ExitFullScreenButtonProps,
} from '../../opensearch_dashboards_react/public';
import {
  createOsdUrlTracker,
  Storage,
  createOsdUrlStateStorage,
  withNotifyOnErrors,
} from '../../opensearch_dashboards_utils/public';
import {
  OpenSearchDashboardsLegacySetup,
  OpenSearchDashboardsLegacyStart,
} from '../../opensearch_dashboards_legacy/public';
import { FeatureCatalogueCategory, HomePublicPluginSetup } from '../../../plugins/home/public';
import { DEFAULT_APP_CATEGORIES, DEFAULT_NAV_GROUPS } from '../../../core/public';

import {
  ACTION_CLONE_PANEL,
  ACTION_EXPAND_PANEL,
  ACTION_REPLACE_PANEL,
  ClonePanelAction,
  ClonePanelActionContext,
  createDashboardContainerByValueRenderer,
  DASHBOARD_CONTAINER_TYPE,
  DashboardContainerFactory,
  DashboardContainerFactoryDefinition,
  ExpandPanelAction,
  ExpandPanelActionContext,
  ReplacePanelAction,
  ReplacePanelActionContext,
  ACTION_UNLINK_FROM_LIBRARY,
  UnlinkFromLibraryActionContext,
  UnlinkFromLibraryAction,
  ACTION_ADD_TO_LIBRARY,
  AddToLibraryActionContext,
  AddToLibraryAction,
  ACTION_LIBRARY_NOTIFICATION,
  LibraryNotificationActionContext,
  LibraryNotificationAction,
} from './application';
import {
  createDashboardUrlGenerator,
  DASHBOARD_APP_URL_GENERATOR,
  DashboardUrlGeneratorState,
} from './url_generator';
import { createSavedDashboardLoader } from './saved_dashboards';
import { DashboardConstants } from './dashboard_constants';
import { addEmbeddableToDashboardUrl } from './url_utils/url_helper';
import { PlaceholderEmbeddableFactory } from './application/embeddable/placeholder';
import { UrlGeneratorState } from '../../share/public';
import { AttributeService } from '.';
import {
  AttributeServiceOptions,
  ATTRIBUTE_SERVICE_KEY,
} from './attribute_service/attribute_service';
import { DashboardProvider, DashboardServices } from './types';
import { bootstrap } from './ui_triggers';

declare module '../../share/public' {
  export interface UrlGeneratorStateMapping {
    [DASHBOARD_APP_URL_GENERATOR]: UrlGeneratorState<DashboardUrlGeneratorState>;
  }
}

export type DashboardUrlGenerator = UrlGeneratorContract<typeof DASHBOARD_APP_URL_GENERATOR>;

export interface DashboardFeatureFlagConfig {
  allowByValueEmbeddables: boolean;
}

interface SetupDependencies {
  data: DataPublicPluginSetup;
  embeddable: EmbeddableSetup;
  home?: HomePublicPluginSetup;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacySetup;
  urlForwarding: UrlForwardingSetup;
  share?: SharePluginSetup;
  uiActions: UiActionsSetup;
  usageCollection?: UsageCollectionSetup;
}

interface StartDependencies {
  data: DataPublicPluginStart;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacyStart;
  urlForwarding: UrlForwardingStart;
  embeddable: EmbeddableStart;
  inspector: InspectorStartContract;
  navigation: NavigationStart;
  savedObjectsClient: SavedObjectsClientContract;
  share?: SharePluginStart;
  uiActions: UiActionsStart;
  savedObjects: SavedObjectsStart;
  contextProvider?: import('../../context_provider/public').ContextProviderStart;
}

export type RegisterDashboardProviderFn = (provider: DashboardProvider) => void;

export interface DashboardSetup {
  registerDashboardProvider: RegisterDashboardProviderFn;
}

export interface DashboardStart {
  getSavedDashboardLoader: () => SavedObjectLoader;
  addEmbeddableToDashboard: (options: {
    embeddableId: string;
    embeddableType: string;
  }) => void | undefined;
  dashboardUrlGenerator?: DashboardUrlGenerator;
  dashboardFeatureFlagConfig: DashboardFeatureFlagConfig;
  DashboardContainerByValueRenderer: ReturnType<typeof createDashboardContainerByValueRenderer>;
  getAttributeService: <
    A extends { title: string },
    V extends EmbeddableInput & { [ATTRIBUTE_SERVICE_KEY]: A } = EmbeddableInput & {
      [ATTRIBUTE_SERVICE_KEY]: A;
    },
    R extends SavedObjectEmbeddableInput = SavedObjectEmbeddableInput
  >(
    type: string,
    options: AttributeServiceOptions<A>
  ) => AttributeService<A, V, R>;
}

declare module '../../../plugins/ui_actions/public' {
  export interface ActionContextMapping {
    [ACTION_EXPAND_PANEL]: ExpandPanelActionContext;
    [ACTION_REPLACE_PANEL]: ReplacePanelActionContext;
    [ACTION_CLONE_PANEL]: ClonePanelActionContext;
    [ACTION_ADD_TO_LIBRARY]: AddToLibraryActionContext;
    [ACTION_UNLINK_FROM_LIBRARY]: UnlinkFromLibraryActionContext;
    [ACTION_LIBRARY_NOTIFICATION]: LibraryNotificationActionContext;
  }
}

export class DashboardPlugin
  implements Plugin<DashboardSetup, DashboardStart, SetupDependencies, StartDependencies> {
  constructor(private initializerContext: PluginInitializerContext) {}

  private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
  private stopUrlTracking: (() => void) | undefined = undefined;
  private getActiveUrl: (() => string) | undefined = undefined;
  private currentHistory: ScopedHistory | undefined = undefined;
  private dashboardFeatureFlagConfig?: DashboardFeatureFlagConfig;

  private dashboardProviders: { [key: string]: DashboardProvider } = {};
  private dashboardUrlGenerator?: DashboardUrlGenerator;
  private currentDashboardContainer?: import('./application/embeddable/dashboard_container').DashboardContainer;

  public setup(
    core: CoreSetup<StartDependencies, DashboardStart>,
    { share, uiActions, embeddable, home, urlForwarding, data, usageCollection }: SetupDependencies
  ): DashboardSetup {
    // bootstrap UI Actions
    bootstrap(uiActions);

    this.dashboardFeatureFlagConfig = this.initializerContext.config.get<
      DashboardFeatureFlagConfig
    >();
    const expandPanelAction = new ExpandPanelAction();
    uiActions.registerAction(expandPanelAction);
    uiActions.attachAction(CONTEXT_MENU_TRIGGER, expandPanelAction.id);
    const startServices = core.getStartServices();

    if (share) {
      this.dashboardUrlGenerator = share.urlGenerators.registerUrlGenerator(
        createDashboardUrlGenerator(async () => {
          const [coreStart, , selfStart] = await startServices;
          return {
            appBasePath: coreStart.application.getUrlForApp('dashboards'),
            useHashedUrl: coreStart.uiSettings.get('state:storeInSessionStorage'),
            savedDashboardLoader: selfStart.getSavedDashboardLoader(),
          };
        })
      );
    }

    const getStartServices = async () => {
      const [coreStart, deps] = await core.getStartServices();

      const useHideChrome = ({ toggleChrome } = { toggleChrome: true }) => {
        React.useEffect(() => {
          if (toggleChrome) {
            coreStart.chrome.setIsVisible(false);
          }

          return () => {
            if (toggleChrome) {
              coreStart.chrome.setIsVisible(true);
            }
          };
        }, [toggleChrome]);
      };

      const ExitFullScreenButton: React.FC<
        ExitFullScreenButtonProps & {
          toggleChrome: boolean;
        }
      > = ({ toggleChrome, ...props }) => {
        useHideChrome({ toggleChrome });
        return <ExitFullScreenButtonUi {...props} />;
      };
      return {
        capabilities: coreStart.application.capabilities,
        application: coreStart.application,
        chrome: coreStart.chrome,
        notifications: coreStart.notifications,
        overlays: coreStart.overlays,
        embeddable: deps.embeddable,
        inspector: deps.inspector,
        SavedObjectFinder: getSavedObjectFinder(coreStart.savedObjects, coreStart.uiSettings),
        ExitFullScreenButton,
        uiActions: deps.uiActions,
      };
    };

    const factory = new DashboardContainerFactoryDefinition(
      getStartServices,
      () => this.currentHistory!
    );
    embeddable.registerEmbeddableFactory(factory.type, factory);

    const placeholderFactory = new PlaceholderEmbeddableFactory();
    embeddable.registerEmbeddableFactory(placeholderFactory.type, placeholderFactory);

    const {
      appMounted,
      appUnMounted,
      stop: stopUrlTracker,
      getActiveUrl,
      restorePreviousUrl,
    } = createOsdUrlTracker({
      baseUrl: core.http.basePath.prepend('/app/dashboards'),
      defaultSubUrl: `#${DashboardConstants.LANDING_PAGE_PATH}`,
      storageKey: `lastUrl:${core.http.basePath.get()}:dashboard`,
      navLinkUpdater$: this.appStateUpdater,
      toastNotifications: core.notifications.toasts,
      stateParams: [
        {
          osdUrlKey: '_g',
          stateUpdate$: data.query.state$.pipe(
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
      getHistory: () => this.currentHistory!,
    });

    this.getActiveUrl = getActiveUrl;
    this.stopUrlTracking = () => {
      stopUrlTracker();
    };

    const registerDashboardProvider: RegisterDashboardProviderFn = (
      provider: DashboardProvider
    ) => {
      const found = this.dashboardProviders[provider.savedObjectsType];
      if (found) {
        throw new Error(`DashboardProvider ${provider.savedObjectsType} is registered twice`);
      }
      if (
        isEmpty(provider.createSortText) ||
        isEmpty(provider.createUrl) ||
        isEmpty(provider.createLinkText)
      ) {
        throw new Error(
          `DashboardProvider ${provider.savedObjectsType} requires 'createSortText', 'createLinkText', and 'createUrl'`
        );
      }
      if (isEmpty(provider.savedObjectsType || isEmpty(provider.savedObjectsName))) {
        throw new Error(
          `DashboardProvider ${provider.savedObjectsType} requires 'savedObjectsId', and 'savedObjectsType'`
        );
      }

      this.dashboardProviders[provider.savedObjectsType] = provider;
    };

    registerDashboardProvider({
      savedObjectsType: 'dashboard',
      savedObjectsName: 'Dashboard',
      appId: 'dashboard',
      viewUrlPathFn: (obj) => `#/view/${obj.id}`,
      editUrlPathFn: (obj) => `/view/${obj.id}?_a=(viewMode:edit)`,
      createUrl: core.http.basePath.prepend('/app/dashboards#/create'),
      createSortText: 'Dashboard',
      createLinkText: (
        <FormattedMessage
          id="dashboard.tableListView.listing.createNewItemButtonLabel"
          defaultMessage="{entityName}"
          values={{ entityName: 'Dashboard' }}
        />
      ),
    });

    const app: App = {
      id: DashboardConstants.DASHBOARDS_ID,
      title: 'Dashboards',
      order: 2500,
      workspaceAvailability: WorkspaceAvailability.insideWorkspace,
      euiIconType: 'inputOutput',
      defaultPath: `#${DashboardConstants.LANDING_PAGE_PATH}`,
      updater$: this.appStateUpdater,
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      mount: async (params: AppMountParameters) => {
        const [coreStart, pluginsStart, dashboardStart] = await core.getStartServices();
        this.currentHistory = params.history;

        // make sure the index pattern list is up to date
        pluginsStart.data.indexPatterns.clearCache();
        // make sure a default index pattern exists
        // if not, the page will be redirected to management and dashboard won't be rendered
        await pluginsStart.data.indexPatterns.ensureDefaultIndexPattern();

        appMounted();
        const {
          embeddable: embeddableStart,
          navigation,
          share: shareStart,
          data: dataStart,
          opensearchDashboardsLegacy: { dashboardConfig },
          urlForwarding: { navigateToDefaultApp, navigateToLegacyOpenSearchDashboardsUrl },
          savedObjects,
        } = pluginsStart;

        // dispatch synthetic hash change event to update hash history objects
        // this is necessary because hash updates triggered by using popState won't trigger this event naturally.
        const unlistenParentHistory = params.history.listen(() => {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        });

        const history = createHashHistory(); // need more research
        const services: DashboardServices = {
          ...coreStart,
          uiActions: pluginsStart.uiActions,
          pluginInitializerContext: this.initializerContext,
          opensearchDashboardsVersion: this.initializerContext.env.packageInfo.version,
          history,
          osdUrlStateStorage: createOsdUrlStateStorage({
            history,
            useHash: coreStart.uiSettings.get('state:storeInSessionStorage'),
            ...withNotifyOnErrors(coreStart.notifications.toasts),
          }),
          core: coreStart,
          dashboardConfig,
          navigateToDefaultApp,
          navigateToLegacyOpenSearchDashboardsUrl,
          navigation,
          share: shareStart,
          data: dataStart,
          savedObjectsClient: coreStart.savedObjects.client,
          savedDashboards: dashboardStart.getSavedDashboardLoader(),
          dashboardProviders: () => this.dashboardProviders,
          chrome: coreStart.chrome,
          addBasePath: coreStart.http.basePath.prepend,
          uiSettings: coreStart.uiSettings,
          savedQueryService: dataStart.query.savedQueries,
          embeddable: embeddableStart,
          // @ts-expect-error TS2322 TODO(ts-error): fixme
          dashboardCapabilities: coreStart.application.capabilities.dashboard,
          embeddableCapabilities: {
            visualizeCapabilities: coreStart.application.capabilities.visualize,
            mapsCapabilities: coreStart.application.capabilities.maps,
          },
          localStorage: new Storage(localStorage),
          usageCollection,
          scopedHistory: params.history,
          setHeaderActionMenu: params.setHeaderActionMenu,
          savedObjectsPublic: savedObjects,
          restorePreviousUrl,
          toastNotifications: coreStart.notifications.toasts,
        };
        // make sure the index pattern list is up to date
        await dataStart.indexPatterns.clearCache();
        params.element.classList.add('dshAppContainer');
        const { renderApp } = await import('./application');
        const unmount = renderApp(params, services);
        return () => {
          params.element.classList.remove('dshAppContainer');
          unlistenParentHistory();
          unmount();
          appUnMounted();
        };
      },
    };

    core.application.register(app);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, [
      {
        id: app.id,
        order: 400,
        category: undefined,
      },
    ]);
    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS['security-analytics'], [
      {
        id: app.id,
        order: 400,
        category: undefined,
      },
    ]);
    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.essentials, [
      {
        id: app.id,
        order: 300,
        category: undefined,
      },
    ]);
    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.search, [
      {
        id: app.id,
        order: 300,
        category: undefined,
      },
    ]);
    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      {
        id: app.id,
        order: 300,
        category: undefined,
      },
    ]);

    urlForwarding.forwardApp(
      DashboardConstants.DASHBOARDS_ID,
      DashboardConstants.DASHBOARDS_ID,
      (path) => {
        const [, tail] = /(\?.*)/.exec(path) || [];
        // carry over query if it exists
        return `#/list${tail || ''}`;
      }
    );
    urlForwarding.forwardApp(
      DashboardConstants.DASHBOARD_ID,
      DashboardConstants.DASHBOARDS_ID,
      (path) => {
        const [, id, tail] = /dashboard\/?(.*?)($|\?.*)/.exec(path) || [];
        if (!id && !tail) {
          // unrecognized sub url
          return '#/list';
        }
        if (!id && tail) {
          // unsaved dashboard, but probably state in URL
          return `#/create${tail || ''}`;
        }
        // persisted dashboard, probably with url state
        return `#/view/${id}${tail || ''}`;
      }
    );

    if (home) {
      home.featureCatalogue.register({
        id: DashboardConstants.DASHBOARD_ID,
        title: i18n.translate('dashboard.featureCatalogue.dashboardTitle', {
          defaultMessage: 'Dashboard',
        }),
        subtitle: i18n.translate('dashboard.featureCatalogue.dashboardSubtitle', {
          defaultMessage: 'Analyze data in dashboards.',
        }),
        description: i18n.translate('dashboard.featureCatalogue.dashboardDescription', {
          defaultMessage: 'Display and share a collection of visualizations and saved searches.',
        }),
        icon: 'dashboardApp',
        path: `/app/dashboards#${DashboardConstants.LANDING_PAGE_PATH}`,
        showOnHomePage: false,
        category: FeatureCatalogueCategory.DATA,
        solutionId: 'opensearchDashboards',
        order: 100,
      });
    }

    return {
      registerDashboardProvider,
    };
  }

  private addEmbeddableToDashboard(
    core: CoreStart,
    { embeddableId, embeddableType }: { embeddableId: string; embeddableType: string }
  ) {
    if (!this.getActiveUrl) {
      throw new Error('dashboard is not ready yet.');
    }

    const lastDashboardUrl = this.getActiveUrl();
    const dashboardUrl = addEmbeddableToDashboardUrl(
      lastDashboardUrl,
      embeddableId,
      embeddableType
    );
    core.application.navigateToApp('dashboards', { path: dashboardUrl });
  }

  public start(core: CoreStart, plugins: StartDependencies): DashboardStart {
    const { notifications } = core;
    const {
      uiActions,
      data: { indexPatterns, search },
      embeddable,
      contextProvider,
    } = plugins;

    // Register Dashboard Context Contributor with Context Provider
    if (contextProvider) {
      const { DashboardContextContributor } = require('./context_contributor');
      const dashboardContextContributor = new DashboardContextContributor(() => {
        console.log('🔍 Dashboard: Getting current container:', {
          hasContainer: !!this.currentDashboardContainer,
          containerType: this.currentDashboardContainer?.type,
          containerId: this.currentDashboardContainer?.id,
        });
        return this.currentDashboardContainer;
      }, core.savedObjects.client);

      contextProvider.registerContextContributor(dashboardContextContributor);
      console.log('📝 Dashboard: Context contributor registered with Context Provider');
    } else {
      console.log(
        '⚠️ Dashboard: Context Provider plugin not available, skipping context registration'
      );
    }

    // AI Chatbot Integration - Register Test UI Actions
    console.log('🤖 Dashboard Plugin - Registering AI Chatbot UI Actions');
    this.registerAIChatbotActions(uiActions);

    // Make plugin instance available globally so dashboard components can set the container
    (window as any).dashboardPlugin = this;

    const SavedObjectFinder = getSavedObjectFinder(
      core.savedObjects,
      core.uiSettings,
      plugins.data,
      core.application
    );

    // Register dashboard navigation shortcuts only when workspace is available
    if (core.keyboardShortcut) {
      // Check if workspaces are initialized and available
      const isInitialized = core.workspaces.initialized$.getValue();
      const currentWorkspace = core.workspaces.currentWorkspace$.getValue();

      if (isInitialized && currentWorkspace) {
        core.keyboardShortcut.register({
          id: 'nav.dashboard',
          name: i18n.translate('dashboard.keyboardShortcut.goToDashboard.name', {
            defaultMessage: 'Go to dashboard',
          }),
          pluginId: 'dashboard',
          category: i18n.translate('dashboard.keyboardShortcut.category.navigation', {
            defaultMessage: 'Navigation',
          }),
          keys: 'g b',
          execute: () => {
            core.application.navigateToApp('dashboards');
          },
        });
      }
    }

    const changeViewAction = new ReplacePanelAction(
      core,
      SavedObjectFinder,
      notifications,
      plugins.embeddable.getEmbeddableFactories
    );
    uiActions.registerAction(changeViewAction);
    uiActions.attachAction(CONTEXT_MENU_TRIGGER, changeViewAction.id);

    const clonePanelAction = new ClonePanelAction(core);
    uiActions.registerAction(clonePanelAction);
    uiActions.attachAction(CONTEXT_MENU_TRIGGER, clonePanelAction.id);

    if (this.dashboardFeatureFlagConfig?.allowByValueEmbeddables) {
      const addToLibraryAction = new AddToLibraryAction();
      uiActions.registerAction(addToLibraryAction);
      uiActions.attachAction(CONTEXT_MENU_TRIGGER, addToLibraryAction.id);
      const unlinkFromLibraryAction = new UnlinkFromLibraryAction();
      uiActions.registerAction(unlinkFromLibraryAction);
      uiActions.attachAction(CONTEXT_MENU_TRIGGER, unlinkFromLibraryAction.id);

      const libraryNotificationAction = new LibraryNotificationAction();
      uiActions.registerAction(libraryNotificationAction);
      uiActions.attachAction(PANEL_NOTIFICATION_TRIGGER, libraryNotificationAction.id);
    }

    const savedDashboardLoader = createSavedDashboardLoader({
      savedObjectsClient: core.savedObjects.client,
      indexPatterns,
      search,
      chrome: core.chrome,
      overlays: core.overlays,
    });
    const dashboardContainerFactory = plugins.embeddable.getEmbeddableFactory(
      DASHBOARD_CONTAINER_TYPE
    )! as DashboardContainerFactory;

    return {
      getSavedDashboardLoader: () => savedDashboardLoader,
      addEmbeddableToDashboard: this.addEmbeddableToDashboard.bind(this, core),
      dashboardUrlGenerator: this.dashboardUrlGenerator,
      dashboardFeatureFlagConfig: this.dashboardFeatureFlagConfig!,
      DashboardContainerByValueRenderer: createDashboardContainerByValueRenderer({
        factory: dashboardContainerFactory,
      }),
      getAttributeService: (type: string, options) =>
        new AttributeService(
          type,
          showSaveModal,
          core.i18n.Context,
          core.notifications.toasts,
          options,
          embeddable.getEmbeddableFactory
        ),
    };
  }

  public stop() {
    if (this.stopUrlTracking) {
      this.stopUrlTracking();
    }
  }

  /**
   * Set the current dashboard container (called from dashboard components)
   */
  public setCurrentDashboardContainer(
    container: import('./application/embeddable/dashboard_container').DashboardContainer
  ): void {
    console.log('🔗 Dashboard Plugin: Setting current dashboard container:', {
      containerType: container.type,
      containerId: container.id,
      childCount: container.getChildIds().length,
    });
    this.currentDashboardContainer = container;

    // Note: Context refresh is now handled by dashboard editor after embeddables load
  }

  /**
   * Register test UI Actions for AI Chatbot integration
   */
  private registerAIChatbotActions(uiActions: any) {
    console.log('🤖 Registering AI Chatbot test UI Actions');

    // Register ADD_FILTER_TRIGGER
    uiActions.registerTrigger({
      id: 'ADD_FILTER_TRIGGER',
      title: 'Add Filter',
      description: 'Add a filter to the dashboard',
    });

    uiActions.registerAction({
      id: 'ADD_FILTER_ACTION',
      type: 'ADD_FILTER_TRIGGER',
      getDisplayName: () => 'Add Filter',
      execute: async (context: any) => {
        console.log('🎯 ADD_FILTER_ACTION executed:', context);

        // Show a notification for testing
        const { notifications } = (window as any).aiChatbotServices?.core || {};
        if (notifications) {
          notifications.toasts.addSuccess({
            title: 'Filter Added',
            text: `Added filter: ${context.field} = ${context.value}`,
            'data-test-subj': 'ai-chatbot-filter-success',
          });
        } else {
          // Fallback alert for testing
          alert(`✅ Filter added: ${context.field} = ${context.value}`);
        }

        return Promise.resolve();
      },
    });

    uiActions.attachAction('ADD_FILTER_TRIGGER', 'ADD_FILTER_ACTION');

    // Register EXPAND_PANEL_TRIGGER
    uiActions.registerTrigger({
      id: 'EXPAND_PANEL_TRIGGER',
      title: 'Expand Panel',
      description: 'Expand a dashboard panel to full screen',
    });

    uiActions.registerAction({
      id: 'EXPAND_PANEL_ACTION',
      type: 'EXPAND_PANEL_TRIGGER',
      getDisplayName: () => 'Expand Panel',
      execute: async (context: any) => {
        console.log('🎯 EXPAND_PANEL_ACTION executed:', context);

        // Show a notification for testing
        const { notifications } = (window as any).aiChatbotServices?.core || {};
        if (notifications) {
          notifications.toasts.addSuccess({
            title: 'Panel Expanded',
            text: `Expanded panel: ${context.panelId}`,
            'data-test-subj': 'ai-chatbot-expand-success',
          });
        } else {
          // Fallback alert for testing
          alert(`✅ Panel expanded: ${context.panelId}`);
        }

        return Promise.resolve();
      },
    });

    uiActions.attachAction('EXPAND_PANEL_TRIGGER', 'EXPAND_PANEL_ACTION');

    console.log('✅ AI Chatbot UI Actions registered successfully');
  }
}
