/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Subscription } from 'rxjs';
import { debounce } from 'lodash';
import { UnregisterCallback } from 'history';
import { CoreSetup, Plugin } from '../../../core/public';
import { getStateFromOsdUrl } from '../../opensearch_dashboards_utils/public';
import { formatUrlWithWorkspaceId } from './utils';
import { WORKSPACE_ID_STATE_KEY } from '../common/constants';

export class WorkspacePlugin implements Plugin<{}, {}, {}> {
  private core?: CoreSetup;
  private URLChange$ = new BehaviorSubject('');
  private currentWorkspaceIdSubscription = new Subscription();
  private urlChangeSubscription = new Subscription();
  private historyUnregisterCallback?: UnregisterCallback;
  private getworkspaceIdFromURL(): string | null {
    return getStateFromOsdUrl(WORKSPACE_ID_STATE_KEY);
  }

  /**
   * Current workspace id may come from multiple source: 1. url hash 2. memory: core.workspaces 3. localstorage
   * this methods will detect if there is any workspace id present and return that.
   * @returns string
   */
  private getworkspaceId(): string {
    // workspace id in url has highest priority
    const workspaceIdFromUrl = this.getworkspaceIdFromURL();
    if (workspaceIdFromUrl) {
      return workspaceIdFromUrl;
    }

    // workspace id in memory has second priority and mainly used for reserve workspace id when navigating through SPA
    const workspaceIdFromMemory = this.core?.workspaces.currentWorkspaceId$.getValue();

    if (workspaceIdFromMemory) {
      return workspaceIdFromMemory;
    }

    // workspace in localStorage is used in cases like Discover that will open a new tab in the browser, the localStorage will be used for cross-tab communication.
    const workspaceIdFromLocalStorage = localStorage.getItem(WORKSPACE_ID_STATE_KEY);

    if (workspaceIdFromLocalStorage) {
      return workspaceIdFromLocalStorage;
    }

    return '';
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
      this.historyUnregisterCallback = startService[0].application.history.listen(() => {
        if (this.shouldPatchUrl()) {
          const currentWorkspaceId = this.getworkspaceId();
          this.URLChange$.next(this.getPatchedUrl(window.location.href, currentWorkspaceId));
        }
      });
    }
  }

  private listenToCurrentWorkspaceChange() {
    this.currentWorkspaceIdSubscription = (this
      .core as CoreSetup).workspaces.currentWorkspaceId$.subscribe((currentWorkspaceId) => {
      localStorage.setItem(WORKSPACE_ID_STATE_KEY, currentWorkspaceId);
      if (this.shouldPatchUrl()) {
        this.URLChange$.next(this.getPatchedUrl(window.location.href, currentWorkspaceId));
      }
    });
  }

  public async setup(core: CoreSetup) {
    this.core = core;

    /**
     * Retrive workspace id from url
     */
    const workspaceId = this.getworkspaceId();

    /**
     * listen to current workspace change and patch workspace id in hash
     */
    this.listenToCurrentWorkspaceChange();

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

    if (workspaceId) {
      /**
       * Enter a workspace
       */
      this.core.workspaces.currentWorkspaceId$.next(workspaceId);
    }

    return {};
  }

  public start() {
    return {};
  }

  public stop() {
    this.urlChangeSubscription.unsubscribe();
    this.currentWorkspaceIdSubscription.unsubscribe();
    this.historyUnregisterCallback?.();
    window.removeEventListener('hashchange', this.hashChangeHandler);

    /**
     * Remove the localStorage record here so that when user copy a url without workspace id
     * the record in local storage won't pollute getWorkspaceId
     */
    localStorage.removeItem(WORKSPACE_ID_STATE_KEY);
  }
}
