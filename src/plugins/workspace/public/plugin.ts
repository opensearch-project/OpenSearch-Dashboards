/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import type { Subscription } from 'rxjs';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AppMountParameters,
  AppNavLinkStatus,
  ChromeNavLink,
  CoreSetup,
  CoreStart,
  Plugin,
  WorkspaceObject,
  DEFAULT_APP_CATEGORIES,
} from '../../../core/public';
import {
  WORKSPACE_LIST_APP_ID,
  WORKSPACE_UPDATE_APP_ID,
  WORKSPACE_CREATE_APP_ID,
  WORKSPACE_OVERVIEW_APP_ID,
  WORKSPACE_FATAL_ERROR_APP_ID,
} from '../common/constants';
import { SavedObjectsManagementPluginSetup } from '../../saved_objects_management/public';
import { getWorkspaceColumn } from './components/utils/workspace_column';
import { getWorkspaceIdFromUrl } from '../../../core/public/utils';
import { WorkspaceClient } from './workspace_client';
import { renderWorkspaceMenu } from './render_workspace_menu';
import { Services } from './types';
import { featureMatchesConfig } from './utils';

interface WorkspacePluginSetupDeps {
  savedObjectsManagement?: SavedObjectsManagementPluginSetup;
}

export class WorkspacePlugin implements Plugin<{}, {}, WorkspacePluginSetupDeps> {
  private coreStart?: CoreStart;
  private currentWorkspaceSubscription?: Subscription;

  private getWorkspaceIdFromURL(): string | null {
    return getWorkspaceIdFromUrl(window.location.href);
  }

  public async setup(core: CoreSetup, { savedObjectsManagement }: WorkspacePluginSetupDeps) {
    core.chrome.registerCollapsibleNavHeader(renderWorkspaceMenu);
    const workspaceClient = new WorkspaceClient(core.http, core.workspaces);
    await workspaceClient.init();
    /**
     * Retrieve workspace id from url
     */
    const workspaceId = this.getWorkspaceIdFromURL();

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
              error: result.error,
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
    /**
     * register workspace column into saved objects table
     */
    savedObjectsManagement?.columns.register(getWorkspaceColumn(core));

    type WorkspaceAppType = (params: AppMountParameters, services: Services) => () => void;
    const mountWorkspaceApp = async (params: AppMountParameters, renderApp: WorkspaceAppType) => {
      const [coreStart] = await core.getStartServices();
      const services = {
        ...coreStart,
        workspaceClient,
      };

      return renderApp(params, services);
    };

    // create
    core.application.register({
      id: WORKSPACE_CREATE_APP_ID,
      title: i18n.translate('workspace.settings.workspaceCreate', {
        defaultMessage: 'Create Workspace',
      }),
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderCreatorApp } = await import('./application');
        return mountWorkspaceApp(params, renderCreatorApp);
      },
    });

    // overview
    core.application.register({
      id: WORKSPACE_OVERVIEW_APP_ID,
      title: i18n.translate('workspace.settings.workspaceOverview', {
        defaultMessage: 'Overview',
      }),
      order: 0,
      euiIconType: 'grid',
      navLinkStatus: !!workspaceId ? AppNavLinkStatus.default : AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderOverviewApp } = await import('./application');
        return mountWorkspaceApp(params, renderOverviewApp);
      },
    });

    // update
    core.application.register({
      id: WORKSPACE_UPDATE_APP_ID,
      title: i18n.translate('workspace.settings.workspaceUpdate', {
        defaultMessage: 'Workspace Settings',
      }),
      euiIconType: 'managementApp',
      navLinkStatus: !!workspaceId ? AppNavLinkStatus.default : AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderUpdateApp } = await import('./application');
        return mountWorkspaceApp(params, renderUpdateApp);
      },
    });

    // list
    core.application.register({
      id: WORKSPACE_LIST_APP_ID,
      title: '',
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderListApp } = await import('./application');
        return mountWorkspaceApp(params, renderListApp);
      },
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

    return {};
  }

  private _changeSavedObjectCurrentWorkspace() {
    if (this.coreStart) {
      return this.coreStart.workspaces.currentWorkspaceId$.subscribe((currentWorkspaceId) => {
        if (currentWorkspaceId) {
          this.coreStart?.savedObjects.client.setCurrentWorkspace(currentWorkspaceId);
        }
      });
    }
  }

  private filterByWorkspace(workspace: WorkspaceObject | null, allNavLinks: ChromeNavLink[]) {
    if (!workspace) return allNavLinks;
    const features = workspace.features ?? ['*'];
    return allNavLinks.filter(featureMatchesConfig(features));
  }

  private filterNavLinks(core: CoreStart) {
    const navLinksService = core.chrome.navLinks;
    const allNavLinks$ = navLinksService.getAllNavLinks$();
    const currentWorkspace$ = core.workspaces.currentWorkspace$;
    combineLatest([
      allNavLinks$.pipe(map(this.changeCategoryNameByWorkspaceFeatureFlag)),
      currentWorkspace$,
    ]).subscribe(([allNavLinks, currentWorkspace]) => {
      const filteredNavLinks = this.filterByWorkspace(currentWorkspace, allNavLinks);
      const navLinks = new Map<string, ChromeNavLink>();
      filteredNavLinks.forEach((chromeNavLink) => {
        navLinks.set(chromeNavLink.id, chromeNavLink);
      });
      navLinksService.setNavLinks(navLinks);
    });
  }

  /**
   * The category "Opensearch Dashboards" needs to be renamed as "Library"
   * when workspace feature flag is on, we need to do it here and generate
   * a new item without polluting the original ChromeNavLink.
   */
  private changeCategoryNameByWorkspaceFeatureFlag(chromeLinks: ChromeNavLink[]): ChromeNavLink[] {
    return chromeLinks.map((item) => {
      if (item.category?.id === DEFAULT_APP_CATEGORIES.opensearchDashboards.id) {
        return {
          ...item,
          category: {
            ...item.category,
            label: i18n.translate('core.ui.libraryNavList.label', {
              defaultMessage: 'Library',
            }),
          },
        };
      }
      return item;
    });
  }

  public start(core: CoreStart) {
    this.coreStart = core;

    this.currentWorkspaceSubscription = this._changeSavedObjectCurrentWorkspace();
    if (core) {
      this.filterNavLinks(core);
    }
    return {};
  }

  public stop() {
    this.currentWorkspaceSubscription?.unsubscribe();
  }
}
