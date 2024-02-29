/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounce } from 'lodash';
import { CoreSetup, Plugin } from '../../../core/public';
import { getStateFromOsdUrl } from '../../opensearch_dashboards_utils/public';
import { formatUrlWithWorkspaceId } from './utils';
import { WORKSPACE_ID_STATE_KEY } from '../common/constants';

export class WorkspacePlugin implements Plugin<{}, {}, {}> {
  private core?: CoreSetup;
  private URLChange$ = new BehaviorSubject('');
  private getWorkpsaceIdFromURL(): string | null {
    return getStateFromOsdUrl(WORKSPACE_ID_STATE_KEY);
  }
  private async getWorkpsaceId(): Promise<string> {
    if (this.getWorkpsaceIdFromURL()) {
      return this.getWorkpsaceIdFromURL() || '';
    }

    return (await this.core?.workspaces.currentWorkspaceId$.getValue()) || '';
  }
  private getPatchedUrl = (url: string, workspaceId: string) => {
    return formatUrlWithWorkspaceId(url, workspaceId);
  };
  private async listenToHashChange(): Promise<void> {
    window.addEventListener('hashchange', async () => {
      if (this.shouldPatchUrl()) {
        const workspaceId = await this.getWorkpsaceId();
        this.URLChange$.next(this.getPatchedUrl(window.location.href, workspaceId));
      }
    });
  }
  private shouldPatchUrl(): boolean {
    const currentWorkspaceId = this.core?.workspaces.currentWorkspaceId$.getValue();
    const workspaceIdFromURL = this.getWorkpsaceIdFromURL();
    if (!currentWorkspaceId && !workspaceIdFromURL) {
      return false;
    }

    if (currentWorkspaceId === workspaceIdFromURL) {
      return false;
    }

    return true;
  }
  private async listenToApplicationChange(): Promise<void> {
    const startService = await this.core?.getStartServices();
    if (startService) {
      combineLatest([
        this.core?.workspaces.currentWorkspaceId$,
        startService[0].application.currentAppId$,
      ]).subscribe(async ([]) => {
        if (this.shouldPatchUrl()) {
          const currentWorkspaceId = await this.getWorkpsaceId();
          this.URLChange$.next(this.getPatchedUrl(window.location.href, currentWorkspaceId));
        }
      });
    }
  }
  public async setup(core: CoreSetup) {
    this.core = core;
    /**
     * Retrive workspace id from url
     */
    const workspaceId = this.getWorkpsaceIdFromURL();

    if (workspaceId) {
      /**
       * Enter a workspace
       */
      this.core.workspaces.currentWorkspaceId$.next(workspaceId);
    }

    /**
     * listen to application change and patch workspace id in hash
     */
    this.listenToApplicationChange();

    /**
     * listen to application internal hash change and patch workspace id in hash
     */
    this.listenToHashChange();

    /**
     * All the URLChange will flush in this subscriber
     */
    this.URLChange$.subscribe(
      debounce(async (url) => {
        history.replaceState(history.state, '', url);
      }, 500)
    );

    return {};
  }

  public start() {
    return {};
  }

  public stop() {}
}
