/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Subscription } from 'rxjs';
import { i18n } from '@osd/i18n';
import {
  AppMountParameters,
  AppNavLinkStatus,
  CoreSetup,
  CoreStart,
  Plugin,
} from '../../../core/public';
import { WORKSPACE_CREATE_APP_ID } from '../common/constants';
import { getWorkspaceIdFromUrl } from '../../../core/public/utils';
import { WorkspaceClient } from './workspace_client';
import { Services } from './types';

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
  private getWorkspaceIdFromURL(basePath?: string): string | null {
    return getWorkspaceIdFromUrl(window.location.href, basePath);
  }
  public async setup(core: CoreSetup) {
    const workspaceClient = new WorkspaceClient(core.http, core.workspaces);
    await workspaceClient.init();

    /**
     * Retrieve workspace id from url
     */
    const workspaceId = this.getWorkspaceIdFromURL(core.http.basePath.getBasePath());

    if (workspaceId) {
      core.workspaces.currentWorkspaceId$.next(workspaceId);
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

    return {};
  }

  public start(core: CoreStart) {
    this.coreStart = core;

    this.currentWorkspaceSubscription = this._changeSavedObjectCurrentWorkspace();
    return {};
  }

  public stop() {
    this.currentWorkspaceSubscription?.unsubscribe();
  }
}
