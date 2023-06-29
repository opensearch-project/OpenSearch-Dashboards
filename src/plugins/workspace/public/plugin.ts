/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { combineLatest } from 'rxjs';
import { i18n } from '@osd/i18n';
import {
  CoreSetup,
  CoreStart,
  Plugin,
  AppMountParameters,
  AppNavLinkStatus,
} from '../../../core/public';
import { WORKSPACE_APP_ID, PATHS } from '../common/constants';
import { WORKSPACE_ID_QUERYSTRING_NAME } from '../../../core/public';
import { mountDropdownList } from './mount';

export class WorkspacesPlugin implements Plugin<{}, {}> {
  private core?: CoreSetup;
  private getWorkpsaceIdFromQueryString(): string | null {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(WORKSPACE_ID_QUERYSTRING_NAME);
  }
  private async getWorkpsaceId(): Promise<string> {
    if (this.getWorkpsaceIdFromQueryString()) {
      return this.getWorkpsaceIdFromQueryString() || '';
    }

    const currentWorkspaceIdResp = await this.core?.workspaces.client.getCurrentWorkspaceId();
    if (currentWorkspaceIdResp?.success && currentWorkspaceIdResp?.result) {
      return currentWorkspaceIdResp.result;
    }

    return '';
  }
  private async listenToApplicationChange(): Promise<void> {
    const startService = await this.core?.getStartServices();
    if (startService) {
      combineLatest([
        this.core?.workspaces.client.currentWorkspaceId$,
        startService[0].application.currentAppId$,
      ]).subscribe(async ([]) => {
        const newUrl = new URL(window.location.href);
        /**
         * Patch workspace id into querystring
         */
        const currentWorkspaceId = await this.getWorkpsaceId();
        if (currentWorkspaceId) {
          newUrl.searchParams.set(WORKSPACE_ID_QUERYSTRING_NAME, currentWorkspaceId);
        } else {
          newUrl.searchParams.delete(WORKSPACE_ID_QUERYSTRING_NAME);
        }
        history.replaceState(history.state, '', newUrl.toString());
      });
    }
  }
  public async setup(core: CoreSetup) {
    this.core = core;
    /**
     * Retrive workspace id from url or sessionstorage
     * url > sessionstorage
     */
    const workspaceId = await this.getWorkpsaceId();

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
     * listen to application change and patch workspace id
     */
    this.listenToApplicationChange();

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

  private async _changeSavedObjectCurrentWorkspace() {
    const startServices = await this.core?.getStartServices();
    if (startServices) {
      const coreStart = startServices[0];
      coreStart.workspaces.client.currentWorkspaceId$.subscribe((currentWorkspaceId) => {
        coreStart.savedObjects.client.setCurrentWorkspace(currentWorkspaceId);
      });
    }
  }

  public start(core: CoreStart) {
    mountDropdownList(core);

    core.chrome.setCustomNavLink({
      title: i18n.translate('workspace.nav.title', { defaultMessage: 'Workspace Overview' }),
      baseUrl: core.http.basePath.get(),
      href: core.application.getUrlForApp(WORKSPACE_APP_ID, { path: PATHS.update }),
    });
    this._changeSavedObjectCurrentWorkspace();
    return {};
  }
}
