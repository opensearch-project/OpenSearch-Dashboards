/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import React from 'react';
import { i18n } from '@osd/i18n';
import { map } from 'rxjs/operators';
import { EuiPanel } from '@elastic/eui';
import {
  Plugin,
  CoreStart,
  CoreSetup,
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
  AppStatus,
  ChromeBreadcrumb,
  WorkspaceAvailability,
  ChromeNavGroupUpdater,
  NavGroupStatus,
  DEFAULT_NAV_GROUPS,
  NavGroupType,
  ALL_USE_CASE_ID,
} from '../../../core/public';
import {
  WORKSPACE_FATAL_ERROR_APP_ID,
  WORKSPACE_DETAIL_APP_ID,
  WORKSPACE_CREATE_APP_ID,
  WORKSPACE_LIST_APP_ID,
  WORKSPACE_INITIAL_APP_ID,
  WORKSPACE_NAVIGATION_APP_ID,
} from '../common/constants';
import { getWorkspaceIdFromUrl } from '../../../core/public/utils';
import { Services, WorkspaceUseCase } from './types';
import { WorkspaceClient } from './workspace_client';
import { SavedObjectsManagementPluginSetup } from '../../../plugins/saved_objects_management/public';
import { ManagementSetup } from '../../../plugins/management/public';
import {
  ANALYTICS_ALL_OVERVIEW_PAGE_ID,
  ContentManagementPluginSetup,
  ContentManagementPluginStart,
  ESSENTIAL_OVERVIEW_PAGE_ID,
} from '../../../plugins/content_management/public';
import { WorkspaceMenu } from './components/workspace_menu/workspace_menu';
import { getWorkspaceColumn } from './components/workspace_column';
import { DataSourceManagementPluginSetup } from '../../../plugins/data_source_management/public';
import {
  enrichBreadcrumbsWithWorkspace,
  filterWorkspaceConfigurableApps,
  getFirstUseCaseOfFeatureConfigs,
  getUseCaseUrl,
  isAppAccessibleInWorkspace,
  isNavGroupInFeatureConfigs,
} from './utils';
import { recentWorkspaceManager } from './recent_workspace_manager';
import { toMountPoint } from '../../opensearch_dashboards_react/public';
import { UseCaseService } from './services/use_case_service';
import { WorkspaceListCard } from './components/service_card';
import { NavigationPublicPluginStart } from '../../../plugins/navigation/public';
import { WorkspacePickerContent } from './components/workspace_picker_content/workspace_picker_content';
import { HOME_CONTENT_AREAS } from '../../../plugins/content_management/public';
import {
  registerEssentialOverviewContent,
  setEssentialOverviewSection,
} from './components/use_case_overview';
import {
  registerAnalyticsAllOverviewContent,
  setAnalyticsAllOverviewSection,
} from './components/use_case_overview/setup_overview';
import { UserDefaultWorkspace } from './components/workspace_list/default_workspace';
import { registerGetStartedCardToNewHome } from './components/home_get_start_card';

type WorkspaceAppType = (
  params: AppMountParameters,
  services: Services,
  props: Record<string, any> & { registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]> }
) => () => void;

interface WorkspacePluginSetupDeps {
  savedObjectsManagement?: SavedObjectsManagementPluginSetup;
  management?: ManagementSetup;
  dataSourceManagement?: DataSourceManagementPluginSetup;
  contentManagement?: ContentManagementPluginSetup;
}

export interface WorkspacePluginStartDeps {
  contentManagement: ContentManagementPluginStart;
  navigation: NavigationPublicPluginStart;
}

export class WorkspacePlugin
  implements Plugin<{}, {}, WorkspacePluginSetupDeps, WorkspacePluginStartDeps> {
  private coreStart?: CoreStart;
  private currentWorkspaceSubscription?: Subscription;
  private breadcrumbsSubscription?: Subscription;
  private currentWorkspaceIdSubscription?: Subscription;
  private managementCurrentWorkspaceIdSubscription?: Subscription;
  private appUpdater$ = new BehaviorSubject<AppUpdater>(() => undefined);
  private navGroupUpdater$ = new BehaviorSubject<ChromeNavGroupUpdater>(() => undefined);
  private unregisterNavGroupUpdater?: () => void;
  private registeredUseCases$ = new BehaviorSubject<WorkspaceUseCase[]>([]);
  private registeredUseCasesUpdaterSubscription?: Subscription;
  private workspaceAndUseCasesCombineSubscription?: Subscription;
  private useCase = new UseCaseService();
  private workspaceClient?: WorkspaceClient;

  private _changeSavedObjectCurrentWorkspace() {
    if (this.coreStart) {
      return this.coreStart.workspaces.currentWorkspaceId$.subscribe((currentWorkspaceId) => {
        if (currentWorkspaceId) {
          this.coreStart?.savedObjects.client.setCurrentWorkspace(currentWorkspaceId);
        }
      });
    }
  }

  /**
   * Filter nav links by the current workspace, once the current workspace change, the nav links(left nav bar)
   * should also be updated according to the configured features of the current workspace
   */
  private filterNavLinks = (core: CoreStart) => {
    const currentWorkspace$ = core.workspaces.currentWorkspace$;

    this.workspaceAndUseCasesCombineSubscription?.unsubscribe();
    this.workspaceAndUseCasesCombineSubscription = combineLatest([
      currentWorkspace$,
      this.registeredUseCases$,
    ]).subscribe(([currentWorkspace, registeredUseCases]) => {
      if (currentWorkspace) {
        const workspaceUseCase = currentWorkspace.features
          ? getFirstUseCaseOfFeatureConfigs(currentWorkspace.features)
          : undefined;

        this.appUpdater$.next((app) => {
          // essential use overview is only available in essential workspace
          if (app.id === ESSENTIAL_OVERVIEW_PAGE_ID && workspaceUseCase === ALL_USE_CASE_ID) {
            return { status: AppStatus.inaccessible };
          }

          if (isAppAccessibleInWorkspace(app, currentWorkspace, registeredUseCases)) {
            return;
          }
          if (app.status === AppStatus.inaccessible) {
            return;
          }
          if (
            registeredUseCases.some(
              (useCase) =>
                useCase.systematic && useCase.features.some((feature) => feature.id === app.id)
            )
          ) {
            return;
          }
          /**
           * Change the app to `inaccessible` if it is not configured in the workspace
           * If trying to access such app, an "Application Not Found" page will be displayed
           */
          return { status: AppStatus.inaccessible };
        });
      }
    });

    this.currentWorkspaceSubscription?.unsubscribe();
    this.currentWorkspaceSubscription = currentWorkspace$.subscribe((currentWorkspace) => {
      if (currentWorkspace) {
        this.navGroupUpdater$.next((navGroup) => {
          /**
           * The following logic determines whether a navigation group should be hidden or not based on the workspace's feature configurations.
           * It checks the following conditions:
           * 1. The navigation group is not a system-level group.
           * 2. The current workspace has feature configurations set up.
           * 3. The current navigation group is not included in the feature configurations of the workspace.
           *
           * If all these conditions are true, it means that the navigation group should be hidden.
           */
          if (
            navGroup.type !== NavGroupType.SYSTEM &&
            currentWorkspace.features &&
            !isNavGroupInFeatureConfigs(navGroup.id, currentWorkspace.features)
          ) {
            return {
              status: NavGroupStatus.Hidden,
            };
          }
        });
      }
    });
  };

  /**
   * Return an observable with the value of all applications which can be configured by workspace
   */
  private getWorkspaceConfigurableApps$ = (core: CoreStart) => {
    return core.application.applications$.pipe(
      map((apps) => filterWorkspaceConfigurableApps([...apps.values()]))
    );
  };

  /**
   * If workspace is enabled and user has entered workspace, hide advance settings by disabling the corresponding apps.
   */
  private disableManagementApps(core: CoreSetup, management: ManagementSetup) {
    const currentWorkspaceId$ = core.workspaces.currentWorkspaceId$;
    this.managementCurrentWorkspaceIdSubscription?.unsubscribe();

    this.managementCurrentWorkspaceIdSubscription = currentWorkspaceId$.subscribe(
      (currentWorkspaceId) => {
        if (currentWorkspaceId) {
          ['settings'].forEach((appId) =>
            management.sections.section.opensearchDashboards.getApp(appId)?.disable()
          );
        }
      }
    );
  }

  /**
   * Add workspace detail page to breadcrumbs
   * @param core CoreStart
   * @private
   */
  private addWorkspaceToBreadcrumbs(core: CoreStart) {
    this.breadcrumbsSubscription = combineLatest([
      core.workspaces.currentWorkspace$,
      core.chrome.getBreadcrumbs$(),
    ]).subscribe(([currentWorkspace, breadcrumbs]) => {
      if (currentWorkspace && breadcrumbs && breadcrumbs.length > 0) {
        // workspace always be the second one
        const workspaceInBreadcrumbs =
          breadcrumbs.length > 1 && breadcrumbs[1]?.text === currentWorkspace.name;
        if (!workspaceInBreadcrumbs) {
          const workspaceBreadcrumb: ChromeBreadcrumb = {
            text: currentWorkspace.name,
            onClick: () => {
              core.application.navigateToApp(WORKSPACE_DETAIL_APP_ID);
            },
          };
          const homeBreadcrumb: ChromeBreadcrumb = {
            text: 'Home',
            onClick: () => {
              core.application.navigateToApp('home');
            },
          };
          breadcrumbs.splice(0, 0, homeBreadcrumb, workspaceBreadcrumb);

          core.chrome.setBreadcrumbs(breadcrumbs);
        }
      }
    });
  }

  public async setup(
    core: CoreSetup<WorkspacePluginStartDeps>,
    {
      savedObjectsManagement,
      management,
      dataSourceManagement,
      contentManagement,
    }: WorkspacePluginSetupDeps
  ) {
    const workspaceClient = new WorkspaceClient(core.http, core.workspaces);
    await workspaceClient.init();
    this.workspaceClient = workspaceClient;
    core.workspaces.setClient(workspaceClient);

    this.useCase.setup({
      chrome: core.chrome,
      getStartServices: core.getStartServices,
      workspaces: core.workspaces,
    });

    core.application.registerAppUpdater(this.appUpdater$);
    this.unregisterNavGroupUpdater = core.chrome.navGroup.registerNavGroupUpdater(
      this.navGroupUpdater$
    );

    //  Hide advance settings and dataSource menus and disable in setup
    if (management) {
      this.disableManagementApps(core, management);
    }

    /**
     * Retrieve workspace id from url
     */
    const workspaceId = getWorkspaceIdFromUrl(
      window.location.href,
      core.http.basePath.getBasePath()
    );

    if (workspaceId) {
      const result = await workspaceClient.enterWorkspace(workspaceId);
      if (!result.success) {
        /**
         * Fatal error service does not support customized actions
         * So we have to use a self-hosted page to show the errors and redirect.
         */
        (async () => {
          const [{ application, chrome }] = await core.getStartServices();
          chrome.setIsVisible(false);
          application.navigateToApp(WORKSPACE_FATAL_ERROR_APP_ID, {
            replace: true,
            state: {
              error: result?.error,
            },
          });
        })();
      } else {
        /**
         * If the workspace id is valid and user is currently on workspace_fatal_error page,
         * we should redirect user to overview page of workspace.
         */
        (async () => {
          const [{ application }] = await core.getStartServices();
          const currentAppIdSubscription = application.currentAppId$.subscribe((currentAppId) => {
            if (currentAppId === WORKSPACE_FATAL_ERROR_APP_ID) {
              application.navigateToApp(WORKSPACE_DETAIL_APP_ID);
            }
            currentAppIdSubscription.unsubscribe();
          });
          // Add workspace id to recent workspaces.
          recentWorkspaceManager.addRecentWorkspace(workspaceId);
        })();
      }
    }

    const mountWorkspaceApp = async (params: AppMountParameters, renderApp: WorkspaceAppType) => {
      const [coreStart, { navigation }] = await core.getStartServices();

      const services = {
        ...coreStart,
        workspaceClient,
        dataSourceManagement,
        navigationUI: navigation.ui,
      };

      return renderApp(params, services, {
        registeredUseCases$: this.registeredUseCases$,
      });
    };

    // create
    core.application.register({
      id: WORKSPACE_CREATE_APP_ID,
      title: i18n.translate('workspace.settings.workspaceCreate', {
        defaultMessage: 'Create a workspace',
      }),
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderCreatorApp } = await import('./application');
        return mountWorkspaceApp(params, renderCreatorApp);
      },
      workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
    });

    // workspace fatal error
    core.application.register({
      id: WORKSPACE_FATAL_ERROR_APP_ID,
      title: '',
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderFatalErrorApp } = await import('./application');
        return mountWorkspaceApp(params, renderFatalErrorApp);
      },
    });

    /**
     * register workspace detail page
     */
    core.application.register({
      id: WORKSPACE_DETAIL_APP_ID,
      title: i18n.translate('workspace.settings.workspaceDetail', {
        defaultMessage: 'Workspace Detail',
      }),
      navLinkStatus: core.chrome.navGroup.getNavGroupEnabled()
        ? AppNavLinkStatus.visible
        : AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderDetailApp } = await import('./application');
        return mountWorkspaceApp(params, renderDetailApp);
      },
    });

    // workspace initial page
    core.application.register({
      id: WORKSPACE_INITIAL_APP_ID,
      title: i18n.translate('workspace.settings.workspaceInitial', {
        defaultMessage: 'Workspace Initial',
      }),
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderInitialApp } = await import('./application');
        return mountWorkspaceApp(params, renderInitialApp);
      },
      workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
    });

    const registeredUseCases$ = this.registeredUseCases$;
    // register workspace navigation
    core.application.register({
      id: WORKSPACE_NAVIGATION_APP_ID,
      title: '',
      chromeless: true,
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount() {
        const [coreStart] = await core.getStartServices();
        const { application, http, workspaces } = coreStart;
        const workspace = workspaces.currentWorkspace$.getValue();
        if (workspace) {
          const availableUseCases = registeredUseCases$.getValue();
          const currentUseCase = availableUseCases.find(
            (useCase) => useCase.id === getFirstUseCaseOfFeatureConfigs(workspace?.features ?? [])
          );
          const useCaseUrl = getUseCaseUrl(currentUseCase, workspace, application, http);
          application.navigateToUrl(useCaseUrl);
        } else {
          application.navigateToApp('home');
        }
        return () => {};
      },
      workspaceAvailability: WorkspaceAvailability.insideWorkspace,
    });

    // workspace list
    core.application.register({
      id: WORKSPACE_LIST_APP_ID,
      title: '',
      /**
       * Nav link status should be visible when nav group enabled.
       * The page should be refreshed and all applications need to register again
       * after nav group enabled changed.
       */
      navLinkStatus: core.chrome.navGroup.getNavGroupEnabled()
        ? AppNavLinkStatus.visible
        : AppNavLinkStatus.hidden,
      description: i18n.translate('workspace.workspaceList.description', {
        defaultMessage: 'Organize collaborative projects in use-case-specific workspaces.',
      }),
      async mount(params: AppMountParameters) {
        const { renderListApp } = await import('./application');
        return mountWorkspaceApp(params, renderListApp);
      },
      workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
    });

    if (core.chrome.navGroup.getNavGroupEnabled() && contentManagement) {
      // workspace essential use case overview
      core.application.register({
        id: ESSENTIAL_OVERVIEW_PAGE_ID,
        title: '',
        async mount(params: AppMountParameters) {
          const { renderUseCaseOverviewApp } = await import('./application');
          const [
            coreStart,
            { contentManagement: contentManagementStart },
          ] = await core.getStartServices();
          const services = {
            ...coreStart,
            workspaceClient,
            dataSourceManagement,
            contentManagement: contentManagementStart,
          };

          return renderUseCaseOverviewApp(params, services, ESSENTIAL_OVERVIEW_PAGE_ID);
        },
        workspaceAvailability: WorkspaceAvailability.insideWorkspace,
      });

      core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.essentials, [
        {
          id: ESSENTIAL_OVERVIEW_PAGE_ID,
          order: -1,
          title: i18n.translate('workspace.nav.essential_overview.title', {
            defaultMessage: 'Overview',
          }),
        },
      ]);

      // initial the page structure
      setEssentialOverviewSection(contentManagement);

      // register workspace Analytics(all) use case overview app
      core.application.register({
        id: ANALYTICS_ALL_OVERVIEW_PAGE_ID,
        title: '',
        async mount(params: AppMountParameters) {
          const { renderUseCaseOverviewApp } = await import('./application');
          const [
            coreStart,
            { contentManagement: contentManagementStart },
          ] = await core.getStartServices();
          const services = {
            ...coreStart,
            workspaceClient,
            dataSourceManagement,
            contentManagement: contentManagementStart,
          };

          return renderUseCaseOverviewApp(params, services, ANALYTICS_ALL_OVERVIEW_PAGE_ID);
        },
        workspaceAvailability: WorkspaceAvailability.insideWorkspace,
      });

      core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
        {
          id: ANALYTICS_ALL_OVERVIEW_PAGE_ID,
          order: -1,
          title: i18n.translate('workspace.nav.analyticsAll_overview.title', {
            defaultMessage: 'Overview',
          }),
        },
      ]);

      // initial the page structure
      setAnalyticsAllOverviewSection(contentManagement);
    }

    /**
     * register workspace column into saved objects table
     */
    savedObjectsManagement?.columns.register(getWorkspaceColumn(core));

    /**
     * Add workspace list to settings and setup group
     */
    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.settingsAndSetup, [
      {
        id: WORKSPACE_LIST_APP_ID,
        order: 350,
        title: i18n.translate('workspace.settings.workspaces', {
          defaultMessage: 'Workspaces',
        }),
      },
    ]);

    if (core.chrome.navGroup.getNavGroupEnabled()) {
      /**
       * Show workspace picker content when outside of workspace and not in any nav group
       */
      core.chrome.registerCollapsibleNavHeader(() => {
        if (!this.coreStart) {
          return null;
        }
        return React.createElement(EuiPanel, {
          hasShadow: false,
          hasBorder: false,
          paddingSize: 's',
          children: [
            React.createElement(WorkspacePickerContent, {
              key: 'workspacePickerContent',
              coreStart: this.coreStart,
              registeredUseCases$: this.registeredUseCases$,
            }),
          ],
        });
      });
    }

    return {};
  }

  public start(core: CoreStart, { contentManagement, navigation }: WorkspacePluginStartDeps) {
    this.coreStart = core;

    this.currentWorkspaceIdSubscription = this._changeSavedObjectCurrentWorkspace();

    const useCaseStart = this.useCase.start({
      chrome: core.chrome,
      workspaceConfigurableApps$: this.getWorkspaceConfigurableApps$(core),
    });

    this.registeredUseCasesUpdaterSubscription = useCaseStart
      .getRegisteredUseCases$()
      .subscribe((registeredUseCases) => {
        this.registeredUseCases$.next(registeredUseCases);
      });

    this.filterNavLinks(core);

    if (!core.chrome.navGroup.getNavGroupEnabled()) {
      this.addWorkspaceToBreadcrumbs(core);
    } else {
      /**
       * Register workspace dropdown selector on the left navigation bottom
       */
      core.chrome.navControls.registerLeftBottom({
        order: 2,
        mount: toMountPoint(
          React.createElement(WorkspaceMenu, {
            coreStart: core,
            registeredUseCases$: this.registeredUseCases$,
          })
        ),
      });

      // register workspace list in home page
      this.registerWorkspaceListToHome(core, contentManagement);

      // register get started card in new home page
      registerGetStartedCardToNewHome(core, contentManagement, this.registeredUseCases$);

      // register workspace list to user settings page
      this.registerWorkspaceListToUserSettings(core, contentManagement, navigation);

      // set breadcrumbs enricher for workspace
      this.breadcrumbsSubscription = enrichBreadcrumbsWithWorkspace(core);

      // register content to essential overview page
      registerEssentialOverviewContent(contentManagement, core);

      // register content to analytics(All) overview page
      registerAnalyticsAllOverviewContent(contentManagement, core);
    }
    return {};
  }

  private registerWorkspaceListToHome(
    core: CoreStart,
    contentManagement: ContentManagementPluginStart
  ) {
    if (contentManagement) {
      contentManagement.registerContentProvider({
        id: 'workspace_list_card_home',
        getContent: () => ({
          id: 'workspace_list',
          kind: 'custom',
          order: 0,
          width: 16,
          render: () => React.createElement(WorkspaceListCard, { core }),
        }),
        getTargetArea: () => HOME_CONTENT_AREAS.SERVICE_CARDS,
      });
    }
  }

  private async registerWorkspaceListToUserSettings(
    coreStart: CoreStart,
    contentManagement: ContentManagementPluginStart,
    navigation: NavigationPublicPluginStart
  ) {
    if (contentManagement) {
      const services: Services = {
        ...coreStart,
        workspaceClient: this.workspaceClient!,
        navigationUI: navigation.ui,
      };
      contentManagement.registerContentProvider({
        id: 'default_workspace_list',
        getContent: () => ({
          id: 'default_workspace_list',
          kind: 'custom',
          order: 0,
          render: () =>
            React.createElement(UserDefaultWorkspace, {
              services,
              registeredUseCases$: this.registeredUseCases$,
            }),
        }),
        getTargetArea: () => 'user_settings/default_workspace',
      });
    }
  }

  public stop() {
    this.currentWorkspaceSubscription?.unsubscribe();
    this.currentWorkspaceIdSubscription?.unsubscribe();
    this.managementCurrentWorkspaceIdSubscription?.unsubscribe();
    this.breadcrumbsSubscription?.unsubscribe();
    this.unregisterNavGroupUpdater?.();
    this.registeredUseCasesUpdaterSubscription?.unsubscribe();
    this.workspaceAndUseCasesCombineSubscription?.unsubscribe();
    this.useCase.stop();
  }
}
