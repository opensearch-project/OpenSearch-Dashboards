/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import type { Subscription } from 'rxjs';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApplicationStart,
  AppMountParameters,
  AppNavLinkStatus,
  ChromeNavLink,
  CoreSetup,
  CoreStart,
  Plugin,
  WorkspaceAttribute,
  WorkspacesStart,
  DEFAULT_APP_CATEGORIES,
} from '../../../core/public';
import {
  WORKSPACE_LIST_APP_ID,
  WORKSPACE_UPDATE_APP_ID,
  WORKSPACE_CREATE_APP_ID,
  WORKSPACE_OVERVIEW_APP_ID,
  WORKSPACE_NAV_CATEGORY,
} from '../common/constants';
import { mountDropdownList } from './mount';
import { SavedObjectsManagementPluginSetup } from '../../saved_objects_management/public';
import { getWorkspaceColumn } from './components/utils/workspace_column';
import { getWorkspaceIdFromUrl, WORKSPACE_PATH_PREFIX } from '../../../core/public/utils';

interface WorkspacesPluginSetupDeps {
  savedObjectsManagement?: SavedObjectsManagementPluginSetup;
}

export class WorkspacesPlugin implements Plugin<{}, {}, WorkspacesPluginSetupDeps> {
  private coreSetup?: CoreSetup;
  private coreStart?: CoreStart;
  private currentWorkspaceSubscription?: Subscription;
  private getWorkspaceIdFromURL(): string | null {
    return getWorkspaceIdFromUrl(window.location.href);
  }
  private getPatchedUrl = (url: string, workspaceId: string) => {
    const newUrl = new URL(url, window.location.href);
    /**
     * Patch workspace id into path
     */
    newUrl.pathname = this.coreSetup?.http.basePath.remove(newUrl.pathname) || '';
    if (workspaceId) {
      newUrl.pathname = `${WORKSPACE_PATH_PREFIX}/${workspaceId}${newUrl.pathname}`;
    } else {
      newUrl.pathname = newUrl.pathname.replace(/^\/w\/([^\/]*)/, '');
    }

    newUrl.pathname =
      this.coreSetup?.http.basePath.prepend(newUrl.pathname, {
        withoutWorkspace: true,
      }) || '';

    return newUrl.toString();
  };
  public async setup(core: CoreSetup, { savedObjectsManagement }: WorkspacesPluginSetupDeps) {
    // If workspace feature is disabled, it will not load the workspace plugin
    if (core.uiSettings.get('workspace:enabled') === false) {
      return {};
    }

    this.coreSetup = core;
    core.workspaces.setFormatUrlWithWorkspaceId((url, id) => this.getPatchedUrl(url, id));
    /**
     * Retrieve workspace id from url
     */
    const workspaceId = this.getWorkspaceIdFromURL();

    if (workspaceId) {
      const result = await core.workspaces.client.enterWorkspace(workspaceId);
      if (!result.success) {
        core.fatalErrors.add(
          result.error ||
            i18n.translate('workspace.error.setup', {
              defaultMessage: 'Workspace init failed',
            })
        );
      }
    }
    /**
     * register workspace column into saved objects table
     */
    savedObjectsManagement?.columns.register(getWorkspaceColumn(core));

    type WorkspaceAppType = (params: AppMountParameters, services: CoreStart) => () => void;
    const mountWorkspaceApp = async (params: AppMountParameters, renderApp: WorkspaceAppType) => {
      const [coreStart] = await core.getStartServices();
      const services = {
        ...coreStart,
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
        defaultMessage: 'Home',
      }),
      order: 0,
      euiIconType: 'home',
      navLinkStatus: AppNavLinkStatus.default,
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
      navLinkStatus: AppNavLinkStatus.default,
      async mount(params: AppMountParameters) {
        const { renderUpdateApp } = await import('./application');
        return mountWorkspaceApp(params, renderUpdateApp);
      },
    });

    // list
    core.application.register({
      id: WORKSPACE_LIST_APP_ID,
      title: i18n.translate('workspace.settings.workspaceList', {
        defaultMessage: 'See More',
      }),
      euiIconType: 'folderClosed',
      category: WORKSPACE_NAV_CATEGORY,
      navLinkStatus: workspaceId ? AppNavLinkStatus.hidden : AppNavLinkStatus.default,
      async mount(params: AppMountParameters) {
        const { renderListApp } = await import('./application');
        return mountWorkspaceApp(params, renderListApp);
      },
    });

    return {};
  }

  private workspaceToChromeNavLink(
    workspace: WorkspaceAttribute,
    workspacesStart: WorkspacesStart,
    application: ApplicationStart,
    index: number
  ): ChromeNavLink {
    const id = WORKSPACE_OVERVIEW_APP_ID + '/' + workspace.id;
    const url = workspacesStart?.formatUrlWithWorkspaceId(
      application.getUrlForApp(WORKSPACE_OVERVIEW_APP_ID, {
        absolute: true,
      }),
      workspace.id
    );
    return {
      id,
      url,
      order: index,
      hidden: false,
      disabled: false,
      baseUrl: url,
      href: url,
      category: WORKSPACE_NAV_CATEGORY,
      title: i18n.translate('core.ui.workspaceNavList.workspaceName', {
        defaultMessage: workspace.name,
      }),
      externalLink: true,
    };
  }

  private async _changeSavedObjectCurrentWorkspace() {
    if (this.coreStart) {
      return this.coreStart.workspaces.client.currentWorkspaceId$.subscribe(
        (currentWorkspaceId) => {
          this.coreStart?.savedObjects.client.setCurrentWorkspace(currentWorkspaceId);
        }
      );
    }
  }

  private filterByWorkspace(
    workspace: WorkspaceAttribute | null | undefined,
    allNavLinks: ChromeNavLink[]
  ) {
    if (!workspace) return allNavLinks;
    const features = workspace.features ?? [];
    return allNavLinks.filter((item) => features.includes(item.id));
  }

  private filterNavLinks(core: CoreStart) {
    const navLinksService = core.chrome.navLinks;
    const chromeNavLinks$ = navLinksService.getNavLinks$();
    const workspaceList$ = core.workspaces.client.workspaceList$;
    const currentWorkspace$ = core.workspaces.client.currentWorkspace$;
    combineLatest([
      workspaceList$,
      chromeNavLinks$.pipe(map(this.changeCategoryNameByWorkspaceFeatureFlag)),
      currentWorkspace$,
    ]).subscribe(([workspaceList, chromeNavLinks, currentWorkspace]) => {
      const filteredNavLinks = new Map<string, ChromeNavLink>();
      chromeNavLinks = this.filterByWorkspace(currentWorkspace, chromeNavLinks);
      chromeNavLinks.forEach((chromeNavLink) => {
        filteredNavLinks.set(chromeNavLink.id, chromeNavLink);
      });
      if (!currentWorkspace) {
        workspaceList
          .filter((workspace, index) => index < 5)
          .map((workspace, index) =>
            this.workspaceToChromeNavLink(workspace, core.workspaces, core.application, index)
          )
          .forEach((workspaceNavLink) =>
            filteredNavLinks.set(workspaceNavLink.id, workspaceNavLink)
          );
      }
      navLinksService.setFilteredNavLinks(filteredNavLinks);
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
    // If workspace feature is disabled, it will not load the workspace plugin
    if (core.uiSettings.get('workspace:enabled') === false) {
      return {};
    }

    this.coreStart = core;

    mountDropdownList({
      application: core.application,
      workspaces: core.workspaces,
      chrome: core.chrome,
    });
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
