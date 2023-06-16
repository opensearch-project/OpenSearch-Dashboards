/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  CoreSetup,
  CoreStart,
  Plugin,
  AppMountParameters,
  AppNavLinkStatus,
} from '../../../core/public';
import { WORKSPACE_APP_ID, WORKSPACE_ID_IN_SESSION_STORAGE } from '../common/constants';
import { WORKSPACE_ID_QUERYSTRING_NAME } from '../../../core/public';
import { mountDropdownList } from './mount';

export class WorkspacesPlugin implements Plugin<{}, {}> {
  private core?: CoreSetup;
  private addWorkspaceListener() {
    this.core?.workspaces.client.currentWorkspaceId$.subscribe((newWorkspaceId) => {
      try {
        sessionStorage.setItem(WORKSPACE_ID_IN_SESSION_STORAGE, newWorkspaceId);
      } catch (e) {
        /**
         * in incognize mode, this method may throw an error
         * */
      }
    });
  }
  private getWorkpsaceIdFromQueryString(): string | null {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(WORKSPACE_ID_QUERYSTRING_NAME);
  }
  private getWorkpsaceIdFromSessionStorage(): string {
    try {
      return sessionStorage.getItem(WORKSPACE_ID_IN_SESSION_STORAGE) || '';
    } catch (e) {
      /**
       * in incognize mode, this method may throw an error
       * */
      return '';
    }
  }
  private clearWorkspaceIdFromSessionStorage(): void {
    try {
      sessionStorage.removeItem(WORKSPACE_ID_IN_SESSION_STORAGE);
    } catch (e) {
      /**
       * in incognize mode, this method may throw an error
       * */
    }
  }
  public async setup(core: CoreSetup) {
    this.core = core;
    /**
     * Retrive workspace id from url or sessionstorage
     * url > sessionstorage
     */
    const workspaceId =
      this.getWorkpsaceIdFromQueryString() || this.getWorkpsaceIdFromSessionStorage();

    if (workspaceId) {
      const result = await core.workspaces.client.enterWorkspace(workspaceId);
      if (!result.success) {
        this.clearWorkspaceIdFromSessionStorage();
        core.fatalErrors.add(
          result.error ||
            i18n.translate('workspace.error.setup', {
              defaultMessage: 'Workspace init failed',
            })
        );
      }
    }

    /**
     * register a listener
     */
    this.addWorkspaceListener();

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

  public start(core: CoreStart) {
    mountDropdownList(core);
    return {};
  }
}
