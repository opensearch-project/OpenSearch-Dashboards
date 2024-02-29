/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounce } from 'lodash';
import { CoreSetup, Plugin } from '../../../core/public';
import { WORKSPACE_ID_QUERYSTRING_NAME } from '../common/constants';
import { HashURL } from './components/utils/hash_url';

export class WorkspacesPlugin implements Plugin<{}, {}> {
  private core?: CoreSetup;
  private URLChange$ = new BehaviorSubject('');
  private getWorkpsaceIdFromURL(): string | null {
    const hashUrl = new HashURL(window.location.href);
    return hashUrl.hashSearchParams.get(WORKSPACE_ID_QUERYSTRING_NAME) || null;
  }
  private async getWorkpsaceId(): Promise<string> {
    if (this.getWorkpsaceIdFromURL()) {
      return this.getWorkpsaceIdFromURL() || '';
    }

    return (await this.core?.workspaces.currentWorkspaceId$.getValue()) || '';
  }
  private getPatchedUrl = (
    url: string,
    workspaceId: string,
    options?: {
      jumpable?: boolean;
    }
  ) => {
    const newUrl = new HashURL(url, window.location.href);
    /**
     * Patch workspace id into hash
     */
    const currentWorkspaceId = workspaceId;
    const searchParams = newUrl.hashSearchParams;
    if (currentWorkspaceId) {
      searchParams.set(WORKSPACE_ID_QUERYSTRING_NAME, currentWorkspaceId);
    } else {
      searchParams.delete(WORKSPACE_ID_QUERYSTRING_NAME);
    }

    if (options?.jumpable && currentWorkspaceId) {
      /**
       * When in hash, window.location.href won't make browser to reload
       * append a querystring.
       */
      newUrl.searchParams.set(WORKSPACE_ID_QUERYSTRING_NAME, currentWorkspaceId);
    }

    newUrl.hashSearchParams = searchParams;

    return newUrl.toString();
  };
  private async listenToHashChange(): Promise<void> {
    window.addEventListener(
      'hashchange',
      debounce(async (e) => {
        if (this.shouldPatchUrl()) {
          const workspaceId = await this.getWorkpsaceId();
          this.URLChange$.next(this.getPatchedUrl(window.location.href, workspaceId));
        }
      }, 150)
    );
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
}
