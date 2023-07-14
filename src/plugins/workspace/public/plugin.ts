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
import type { Subscription } from 'rxjs';

export class WorkspacesPlugin implements Plugin<{}, {}> {
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
      newUrl.pathname = `${this.coreSetup?.http.basePath.serverBasePath || ''}/w/${workspaceId}${
        newUrl.pathname
      }`;
    } else {
      newUrl.pathname = `${this.coreSetup?.http.basePath.serverBasePath || ''}${newUrl.pathname}`;
    }

    return newUrl.toString();
  };
  public async setup(core: CoreSetup) {
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

  private _changeSavedObjectCurrentWorkspace() {
    if (this.coreStart) {
      return this.coreStart.workspaces.client.currentWorkspaceId$.subscribe(
        (currentWorkspaceId) => {
          this.coreStart?.savedObjects.client.setCurrentWorkspace(currentWorkspaceId);
        }
      );
    }
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
    return {};
  }

  public stop() {
    this.currentWorkspaceSubscription?.unsubscribe();
  }
}
