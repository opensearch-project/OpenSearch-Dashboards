/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, combineLatest } from 'rxjs';
import { i18n } from '@osd/i18n';
import { debounce } from 'lodash';
import {
  CoreSetup,
  CoreStart,
  Plugin,
  AppMountParameters,
  AppNavLinkStatus,
} from '../../../core/public';
import { WORKSPACE_APP_ID, PATHS } from '../common/constants';
import { WORKSPACE_ID_QUERYSTRING_NAME } from '../../../core/public';
import { mountDropdownList } from './mount';
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

    const currentWorkspaceIdResp = await this.core?.workspaces.client.getCurrentWorkspaceId();
    if (currentWorkspaceIdResp?.success && currentWorkspaceIdResp?.result) {
      return currentWorkspaceIdResp.result;
    }

    return '';
  }
  private async getPatchedUrl(url: string) {
    const newUrl = new HashURL(url, window.location.href);
    /**
     * Patch workspace id into hash
     */
    const currentWorkspaceId = await this.getWorkpsaceId();
    const searchParams = newUrl.hashSearchParams;
    if (currentWorkspaceId) {
      searchParams.set(WORKSPACE_ID_QUERYSTRING_NAME, currentWorkspaceId);
    } else {
      searchParams.delete(WORKSPACE_ID_QUERYSTRING_NAME);
    }

    newUrl.hashSearchParams = searchParams;

    return newUrl.toString();
  }
  private async listenToHashChange(): Promise<void> {
    window.addEventListener(
      'hashchange',
      debounce(async (e) => {
        if (this.shouldPatchUrl()) {
          this.URLChange$.next(await this.getPatchedUrl(window.location.href));
        }
      }, 150)
    );
  }
  private shouldPatchUrl(): boolean {
    const currentWorkspaceId = this.core?.workspaces.client.currentWorkspaceId$.getValue();
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
        this.core?.workspaces.client.currentWorkspaceId$,
        startService[0].application.currentAppId$,
      ]).subscribe(async ([currentWorkspaceId]) => {
        if (this.shouldPatchUrl()) {
          this.URLChange$.next(await this.getPatchedUrl(window.location.href));
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

    core.chrome.setCustomNavLink({
      title: i18n.translate('workspace.nav.title', { defaultMessage: 'Workspace Overview' }),
      baseUrl: core.http.basePath.get(),
      href: core.application.getUrlForApp(WORKSPACE_APP_ID, { path: PATHS.update }),
    });
    this._changeSavedObjectCurrentWorkspace();
    return {};
  }
}
