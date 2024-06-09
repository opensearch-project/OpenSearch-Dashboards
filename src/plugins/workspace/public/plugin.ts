/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import React from 'react';
import { i18n } from '@osd/i18n';
import { first } from 'rxjs/operators';
import {
  Plugin,
  CoreStart,
  CoreSetup,
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
  AppStatus,
  PublicAppInfo,
  ChromeBreadcrumb,
  WorkspaceAvailability,
  DEFAULT_APP_CATEGORIES,
} from '../../../core/public';
import {
  WORKSPACE_FATAL_ERROR_APP_ID,
  WORKSPACE_OVERVIEW_APP_ID,
  WORKSPACE_CREATE_APP_ID,
  WORKSPACE_UPDATE_APP_ID,
  WORKSPACE_LIST_APP_ID,
} from '../common/constants';
import { getWorkspaceIdFromUrl } from '../../../core/public/utils';
import { Services } from './types';
import { WorkspaceClient } from './workspace_client';
import { SavedObjectsManagementPluginSetup } from '../../../plugins/saved_objects_management/public';
import { ManagementSetup } from '../../../plugins/management/public';
import { WorkspaceMenu } from './components/workspace_menu/workspace_menu';
import { getWorkspaceColumn } from './components/workspace_column';
import { filterWorkspaceConfigurableApps, isAppAccessibleInWorkspace } from './utils';

type WorkspaceAppType = (
  params: AppMountParameters,
  services: Services,
  props: Record<string, any>
) => () => void;

interface WorkspacePluginSetupDeps {
  savedObjectsManagement?: SavedObjectsManagementPluginSetup;
  management?: ManagementSetup;
}

export class WorkspacePlugin implements Plugin<{}, {}, WorkspacePluginSetupDeps> {
  private coreStart?: CoreStart;
  private currentWorkspaceSubscription?: Subscription;
  private breadcrumbsSubscription?: Subscription;
  private currentWorkspaceIdSubscription?: Subscription;
  private managementCurrentWorkspaceIdSubscription?: Subscription;
  private appUpdater$ = new BehaviorSubject<AppUpdater>(() => undefined);
  private workspaceConfigurableApps$ = new BehaviorSubject<PublicAppInfo[]>([]);
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
    this.currentWorkspaceSubscription?.unsubscribe();

    this.currentWorkspaceSubscription = currentWorkspace$.subscribe((currentWorkspace) => {
      if (currentWorkspace) {
        this.appUpdater$.next((app) => {
          if (isAppAccessibleInWorkspace(app, currentWorkspace)) {
            return;
          }

          if (app.status === AppStatus.inaccessible) {
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
  };

  /**
   * Initiate an observable with the value of all applications which can be configured by workspace
   */
  private setWorkspaceConfigurableApps = async (core: CoreStart) => {
    const allApps = await new Promise<PublicAppInfo[]>((resolve) => {
      core.application.applications$.pipe(first()).subscribe((apps) => {
        resolve([...apps.values()]);
      });
    });
    const availableApps = filterWorkspaceConfigurableApps(allApps);
    this.workspaceConfigurableApps$.next(availableApps);
  };

  /**
   * If workspace is enabled and user has entered workspace, hide advance settings and dataSource menu by disabling the corresponding apps.
   */
  private disableManagementApps(core: CoreSetup, management: ManagementSetup) {
    const currentWorkspaceId$ = core.workspaces.currentWorkspaceId$;
    this.managementCurrentWorkspaceIdSubscription?.unsubscribe();

    this.managementCurrentWorkspaceIdSubscription = currentWorkspaceId$.subscribe(
      (currentWorkspaceId) => {
        if (currentWorkspaceId) {
          ['settings', 'dataSources'].forEach((appId) =>
            management.sections.section.opensearchDashboards.getApp(appId)?.disable()
          );
        }
      }
    );
  }

  /**
   * Add workspace overview page to breadcrumbs
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
              core.application.navigateToApp(WORKSPACE_OVERVIEW_APP_ID);
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
    core: CoreSetup,
    { savedObjectsManagement, management }: WorkspacePluginSetupDeps
  ) {
    const workspaceClient = new WorkspaceClient(core.http, core.workspaces);
    await workspaceClient.init();
    core.application.registerAppUpdater(this.appUpdater$);

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
              application.navigateToApp(WORKSPACE_OVERVIEW_APP_ID);
            }
            currentAppIdSubscription.unsubscribe();
          });
        })();
      }
    }

    const mountWorkspaceApp = async (params: AppMountParameters, renderApp: WorkspaceAppType) => {
      const [coreStart] = await core.getStartServices();
      const services = {
        ...coreStart,
        workspaceClient,
      };

      return renderApp(params, services, {
        workspaceConfigurableApps$: this.workspaceConfigurableApps$,
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
     * register workspace overview page
     */
    core.application.register({
      id: WORKSPACE_OVERVIEW_APP_ID,
      title: i18n.translate('workspace.settings.workspaceOverview', {
        defaultMessage: 'Workspace Overview',
      }),
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderOverviewApp } = await import('./application');
        return mountWorkspaceApp(params, renderOverviewApp);
      },
    });

    /**
     * register workspace update page
     */
    core.application.register({
      id: WORKSPACE_UPDATE_APP_ID,
      title: i18n.translate('workspace.settings.workspaceUpdate', {
        defaultMessage: 'Update Workspace',
      }),
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderUpdaterApp } = await import('./application');
        return mountWorkspaceApp(params, renderUpdaterApp);
      },
    });

    /**
     * Register workspace dropdown selector on the top of left navigation menu
     */
    core.chrome.registerCollapsibleNavHeader((props) => {
      if (!this.coreStart) {
        return null;
      }
      return React.createElement(WorkspaceMenu, { coreStart: this.coreStart, ...props });
    });

    // workspace list
    core.application.register({
      id: WORKSPACE_LIST_APP_ID,
      title: 'Workspaces',
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      async mount(params: AppMountParameters) {
        const { renderListApp } = await import('./application');
        return mountWorkspaceApp(params, renderListApp);
      },
      workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
    });

    /**
     * register workspace column into saved objects table
     */
    savedObjectsManagement?.columns.register(getWorkspaceColumn(core));

    return {};
  }

  public start(core: CoreStart) {
    this.coreStart = core;

    this.currentWorkspaceIdSubscription = this._changeSavedObjectCurrentWorkspace();

    // this.setWorkspaceConfigurableApps(core).then(() => {
    //   // filter the nav links based on the current workspace
    //   this.filterNavLinks(core);
    // });

    this.addWorkspaceToBreadcrumbs(core);

    return {};
  }

  public stop() {
    this.currentWorkspaceSubscription?.unsubscribe();
    this.currentWorkspaceIdSubscription?.unsubscribe();
    this.managementCurrentWorkspaceIdSubscription?.unsubscribe();
    this.breadcrumbsSubscription?.unsubscribe();
  }
}
