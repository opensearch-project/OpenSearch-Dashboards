/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import type { Subscription } from 'rxjs';
import {
  CoreSetup,
  CoreStart,
  Plugin,
  AppMountParameters,
  AppNavLinkStatus,
} from '../../../core/public';
import { WORKSPACE_APP_ID } from '../common/constants';
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
