/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Subscription } from 'rxjs';
import React from 'react';
import { i18n } from '@osd/i18n';
import {
  Plugin,
  CoreStart,
  CoreSetup,
  AppMountParameters,
  AppNavLinkStatus,
  LinksUpdater,
} from '../../../core/public';
import {
  WORKSPACE_FATAL_ERROR_APP_ID,
  WORKSPACE_OVERVIEW_APP_ID,
  WORKSPACE_CREATE_APP_ID,
} from '../common/constants';
import { getWorkspaceIdFromUrl } from '../../../core/public/utils';
import { Services } from './types';
import { WorkspaceClient } from './workspace_client';
import { WorkspaceMenu } from './components/workspace_menu/workspace_menu';
import { featureMatchesConfig } from './utils';

type WorkspaceAppType = (params: AppMountParameters, services: Services) => () => void;

export class WorkspacePlugin implements Plugin<{}, {}, {}> {
  private coreStart?: CoreStart;
  private currentWorkspaceSubscription?: Subscription;
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
  private filterNavLinks(core: CoreStart) {
    const currentWorkspace$ = core.workspaces.currentWorkspace$;
    let filterLinksByWorkspace: LinksUpdater;

    this.currentWorkspaceSubscription?.unsubscribe();
    this.currentWorkspaceSubscription = currentWorkspace$.subscribe((currentWorkspace) => {
      const linkUpdaters$ = core.chrome.navLinks.getLinkUpdaters$();
      let linkUpdaters = linkUpdaters$.value;

      /**
       * It should only have one link filter exist based on the current workspace at a given time
       * So we need to filter out previous workspace link filter before adding new one after changing workspace
       */
      linkUpdaters = linkUpdaters.filter((updater) => updater !== filterLinksByWorkspace);

      /**
       * Whenever workspace changed, this function will filter out those links that should not
       * be displayed. For example, some workspace may not have Observability features configured, in such case,
       * the nav links of Observability features should not be displayed in left nav bar
       */
      filterLinksByWorkspace = (navLinks) => {
        /**
         * Do not filter the nav links when currently not in a workspace, or the current workspace
         * has no feature configured
         */
        if (!currentWorkspace || !currentWorkspace.features) return navLinks;

        const featureFilter = featureMatchesConfig(currentWorkspace.features);
        const filteredNavLinks = [...navLinks.values()].filter((linkWrapper) =>
          featureFilter(linkWrapper.properties)
        );

        const newNavLinks = new Map();
        filteredNavLinks.forEach((chromeNavLink) => {
          newNavLinks.set(chromeNavLink.id, chromeNavLink);
        });
        return newNavLinks;
      };

      linkUpdaters$.next([...linkUpdaters, filterLinksByWorkspace]);
    });
  }

  public async setup(core: CoreSetup) {
    const workspaceClient = new WorkspaceClient(core.http, core.workspaces);
    await workspaceClient.init();

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
     * Register workspace dropdown selector on the top of left navigation menu
     */
    core.chrome.registerCollapsibleNavHeader(() => {
      if (!this.coreStart) {
        return null;
      }
      return React.createElement(WorkspaceMenu, { coreStart: this.coreStart });
    });

    return {};
  }

  public start(core: CoreStart) {
    this.coreStart = core;

    this.currentWorkspaceSubscription = this._changeSavedObjectCurrentWorkspace();

    // When starts, filter the nav links based on the current workspace
    this.filterNavLinks(core);

    return {};
  }

  public stop() {
    this.currentWorkspaceSubscription?.unsubscribe();
  }
}
