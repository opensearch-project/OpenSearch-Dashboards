/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Subscription } from 'rxjs';
import { Plugin, CoreStart, CoreSetup } from '../../../core/public';
import { getWorkspaceIdFromUrl } from '../../../core/public/utils';
import { WorkspaceClient } from './workspace_client';

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
