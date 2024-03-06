/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Subscription } from 'rxjs';
import { debounce } from 'lodash';
import { CoreSetup, Plugin } from '../../../core/public';
import { getStateFromOsdUrl } from '../../opensearch_dashboards_utils/public';
import { formatUrlWithWorkspaceId } from './utils';
import { WORKSPACE_ID_STATE_KEY } from '../common/constants';

export class WorkspacePlugin implements Plugin<{}, {}, {}> {
  private core?: CoreSetup;
  private URLChange$ = new BehaviorSubject('');
  private applicationSubscription = new Subscription();
  private urlChangeSubscription = new Subscription();
  private getworkspaceIdFromURL(): string | null {
    return getStateFromOsdUrl(WORKSPACE_ID_STATE_KEY);
  }
  private getworkspaceId(): string {
    if (this.getworkspaceIdFromURL()) {
      return this.getworkspaceIdFromURL() || '';
    }

    return this.core?.workspaces.currentWorkspaceId$.getValue() || '';
  }
  private getPatchedUrl = (url: string, workspaceId: string) => {
    return formatUrlWithWorkspaceId(url, workspaceId);
  };
  private hashChangeHandler = async () => {
    if (this.shouldPatchUrl()) {
      const workspaceId = await this.getworkspaceId();
      this.URLChange$.next(this.getPatchedUrl(window.location.href, workspaceId));
    }
  };
  private async listenToHashChange(): Promise<void> {
    window.addEventListener('hashchange', this.hashChangeHandler);
  }
  /**
   * When navigating between applications or inside application, the hash state will be overwrote,
   * compare the workspaceId in memory and the workspaceId in hash state,
   * If do not match, return true
   * @returns bool
   */
  private shouldPatchUrl(): boolean {
    const currentWorkspaceId = this.core?.workspaces.currentWorkspaceId$.getValue();
    const workspaceIdFromURL = this.getworkspaceIdFromURL();
    if (!currentWorkspaceId && !workspaceIdFromURL) {
      return false;
    }

    if (currentWorkspaceId === workspaceIdFromURL) {
      return false;
    }

    return true;
  }
  /**
   * When navigating between applications or the subApps inside an application e.g. Dashboard management, the hash state will be overwrote,
   * listen to history change and try to patch the workspaceId into hash state
   */
  private async listenToHistoryChange(): Promise<void> {
    const startService = await this.core?.getStartServices();
    if (startService) {
      startService[0].application.history.listen(() => {
        if (this.shouldPatchUrl()) {
          const currentWorkspaceId = this.getworkspaceId();
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
    const workspaceId = this.getworkspaceIdFromURL();

    if (workspaceId) {
      /**
       * Enter a workspace
       */
      this.core.workspaces.currentWorkspaceId$.next(workspaceId);
    }

    /**
     * listen to history change and patch workspace id in hash
     */
    this.listenToHistoryChange();

    /**
     * listen to application internal hash change and patch workspace id in hash
     */
    this.listenToHashChange();

    /**
     * All the URLChange will flush in this subscriber
     */
    this.urlChangeSubscription = this.URLChange$.subscribe(
      debounce(async (url) => {
        history.replaceState(history.state, '', url);
      }, 500)
    );

    return {};
  }

  public start() {
    return {};
  }

  public stop() {
    this.urlChangeSubscription.unsubscribe();
    this.applicationSubscription.unsubscribe();
    window.removeEventListener('hashchange', this.hashChangeHandler);
  }
}
