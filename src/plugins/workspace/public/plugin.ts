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
import { WORKSPACE_APP_ID } from '../common/constants';
import { mountDropdownList } from './mount';
import { getWorkspaceIdFromUrl } from '../../../core/public/utils';

export class WorkspacesPlugin implements Plugin<{}, {}> {
  private core?: CoreSetup;
  private getWorkspaceIdFromURL(): string | null {
    return getWorkspaceIdFromUrl(window.location.href);
  }
  private getPatchedUrl = (url: string, workspaceId: string) => {
    const newUrl = new URL(url, window.location.href);
    /**
     * Patch workspace id into path
     */
    newUrl.pathname = this.core?.http.basePath.remove(newUrl.pathname) || '';
    if (workspaceId) {
      newUrl.pathname = `${this.core?.http.basePath.serverBasePath || ''}/w/${workspaceId}${
        newUrl.pathname
      }`;
    } else {
      newUrl.pathname = `${this.core?.http.basePath.serverBasePath || ''}${newUrl.pathname}`;
    }

    return newUrl.toString();
  };
  public async setup(core: CoreSetup) {
    this.core = core;
    this.core?.workspaces.setFormatUrlWithWorkspaceId((url, id) => this.getPatchedUrl(url, id));
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
    this._changeSavedObjectCurrentWorkspace();
    return {};
  }
}
