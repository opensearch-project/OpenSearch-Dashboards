/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { i18n } from '@osd/i18n';
import { featureMatchesConfig } from './utils';
import { AppMountParameters, AppNavLinkStatus, ChromeNavLink, CoreSetup, CoreStart, Plugin, WorkspaceObject, DEFAULT_APP_CATEGORIES } from '../../../core/public';
import { WORKSPACE_FATAL_ERROR_APP_ID, WORKSPACE_OVERVIEW_APP_ID } from '../common/constants';
import { getWorkspaceIdFromUrl } from '../../../core/public/utils';
import { Services } from './types';
import { WorkspaceClient } from './workspace_client';

type WorkspaceAppType = (params: AppMountParameters, services: Services) => () => void;

export class WorkspacePlugin implements Plugin<{}, {}> {
  private getWorkspaceIdFromURL(): string | null {
    return getWorkspaceIdFromUrl(window.location.href);
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

  public async setup(core: CoreSetup) {
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

    const mountWorkspaceApp = async (params: AppMountParameters, renderApp: WorkspaceAppType) => {
      const [coreStart] = await core.getStartServices();
      const services = {
        ...coreStart,
        workspaceClient,
      };

      return renderApp(params, services);
    };

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

  public start(core: CoreStart) {
    if (core) {
      this.filterNavLinks(core);
    }
    return {};
  }

  public stop() {}
}
