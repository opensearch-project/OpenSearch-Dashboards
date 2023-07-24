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
import { PATHS, WORKSPACE_APP_ID, WORKSPACE_NAV_CATEGORY } from '../common/constants';
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

    core.application.register({
      id: WORKSPACE_APP_ID,
      title: i18n.translate('workspace.settings.title', {
        defaultMessage: 'Workspace',
      }),
      // order: 6010,
      navLinkStatus: AppNavLinkStatus.hidden,
      // updater$: this.appUpdater,
      async mount(params: AppMountParameters) {
        const { renderApp } = await import('./application');
        const [coreStart] = await core.getStartServices();
        const services = {
          ...coreStart,
        };

        return renderApp(params, services);
      },
    });

    return {};
  }

  private workspaceToChromeNavLink(
    workspace: WorkspaceAttribute,
    workspacesStart: WorkspacesStart,
    application: ApplicationStart
  ): ChromeNavLink {
    const id = WORKSPACE_APP_ID + '/' + workspace.id;
    const url = workspacesStart?.formatUrlWithWorkspaceId(
      application.getUrlForApp(WORKSPACE_APP_ID, {
        path: '/',
        absolute: true,
      }),
      workspace.id
    );
    return {
      id,
      url,
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

  private filterNavLinks(core: CoreStart, workspaceEnabled: boolean) {
    const navLinksService = core.chrome.navLinks;
    const chromeNavLinks$ = navLinksService.getNavLinks$();
    if (workspaceEnabled) {
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
          if (chromeNavLink.id === 'home') {
            // set hidden, icon and order for home nav link
            const homeNavLink: ChromeNavLink = {
              ...chromeNavLink,
              hidden: currentWorkspace !== null,
              euiIconType: 'logoOpenSearch',
              order: 1000,
            };
            filteredNavLinks.set(chromeNavLink.id, homeNavLink);
          } else {
            filteredNavLinks.set(chromeNavLink.id, chromeNavLink);
          }
        });
        workspaceList
          .filter((value, index) => !currentWorkspace && index < 5)
          .map((workspace) =>
            this.workspaceToChromeNavLink(workspace, core.workspaces, core.application)
          )
          .forEach((workspaceNavLink) =>
            filteredNavLinks.set(workspaceNavLink.id, workspaceNavLink)
          );
        // See more
        const seeMoreId = WORKSPACE_APP_ID + PATHS.list;
        const seeMoreUrl = WORKSPACE_APP_ID + PATHS.list;
        const seeMoreNavLink: ChromeNavLink = {
          id: seeMoreId,
          title: i18n.translate('core.ui.workspaceNavList.seeMore', {
            defaultMessage: 'SEE MORE',
          }),
          hidden: currentWorkspace !== null,
          disabled: false,
          baseUrl: seeMoreUrl,
          href: seeMoreUrl,
          category: WORKSPACE_NAV_CATEGORY,
        };
        filteredNavLinks.set(seeMoreId, seeMoreNavLink);
        // Admin
        const adminId = 'admin';
        const adminUrl = '/app/admin';
        const adminNavLink: ChromeNavLink = {
          id: adminId,
          title: i18n.translate('core.ui.workspaceNavList.admin', {
            defaultMessage: 'Admin',
          }),
          hidden: currentWorkspace !== null,
          disabled: true,
          baseUrl: adminUrl,
          href: adminUrl,
          euiIconType: 'managementApp',
          order: 9000,
        };
        filteredNavLinks.set(adminId, adminNavLink);
        // Overview only inside workspace
        if (currentWorkspace) {
          const overviewId = WORKSPACE_APP_ID + PATHS.update;
          const overviewUrl = core.workspaces.formatUrlWithWorkspaceId(
            core.application.getUrlForApp(WORKSPACE_APP_ID, {
              path: PATHS.update,
              absolute: true,
            }),
            currentWorkspace.id
          );
          const overviewNavLink: ChromeNavLink = {
            id: overviewId,
            title: i18n.translate('core.ui.workspaceNavList.overview', {
              defaultMessage: 'Overview',
            }),
            hidden: false,
            disabled: false,
            baseUrl: overviewUrl,
            href: overviewUrl,
            euiIconType: 'grid',
            order: 1000,
          };
          filteredNavLinks.set(overviewId, overviewNavLink);
        }
        navLinksService.setFilteredNavLinks(filteredNavLinks);
      });
    } else {
      chromeNavLinks$.subscribe((chromeNavLinks) => {
        const filteredNavLinks = new Map<string, ChromeNavLink>();
        chromeNavLinks.forEach((chromeNavLink) =>
          filteredNavLinks.set(chromeNavLink.id, chromeNavLink)
        );
        navLinksService.setFilteredNavLinks(filteredNavLinks);
      });
    }
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
      // set default value for filtered nav links
      this.filterNavLinks(core, false);
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
      this.filterNavLinks(core, true);
    }
    return {};
  }

  public stop() {
    this.currentWorkspaceSubscription?.unsubscribe();
  }
}
