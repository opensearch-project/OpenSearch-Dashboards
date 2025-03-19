/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { combineLatest, Subscription } from 'rxjs';
import { i18n } from '@osd/i18n';

import { recentWorkspaceManager } from '../recent_workspace_manager';
import { WORKSPACE_DETAIL_APP_ID, WORKSPACE_FATAL_ERROR_APP_ID } from '../../common/constants';
import { getWorkspaceIdFromUrl } from '../../../../core/public/utils';
import { ApplicationStart, ChromeStart, CoreStart, WorkspaceError } from '../../../../core/public';

export class WorkspaceValidationService {
  private workspaceValidationSubscription?: Subscription;

  constructor() {}

  /**
   * Fatal error service does not support customized actions
   * So we have to use a self-hosted page to show the errors and redirect.
   */
  private handleFatalError(application: ApplicationStart, chrome: ChromeStart, error: unknown) {
    chrome.setIsVisible(false);
    application.navigateToApp(WORKSPACE_FATAL_ERROR_APP_ID, {
      replace: true,
      state: { error },
    });
  }

  setup() {}

  start(core: CoreStart) {
    const { workspaces, application, http, chrome } = core;

    const workspaceError$ = workspaces.workspaceError$;

    const workspaceId = getWorkspaceIdFromUrl(window.location.href, http.basePath.getBasePath());

    this.workspaceValidationSubscription = combineLatest([
      workspaceError$,
      workspaces.initialized$,
    ]).subscribe({
      next: ([reason, initialized]) => {
        if (!reason && initialized) {
          /**
           * If the workspace id is valid and user is currently on workspace_fatal_error page,
           * we should redirect user to overview page of workspace.
           */

          const currentAppIdSubscription = application.currentAppId$.subscribe((currentAppId) => {
            if (currentAppId === WORKSPACE_FATAL_ERROR_APP_ID) {
              application.navigateToApp(WORKSPACE_DETAIL_APP_ID);
            }
            currentAppIdSubscription.unsubscribe();
          });
          // Add workspace id to recent workspaces.
          recentWorkspaceManager.addRecentWorkspace(workspaceId);
        }
        if (reason) {
          this.handleFatalError(
            application,
            chrome,
            reason === WorkspaceError.WORKSPACE_IS_STALE
              ? i18n.translate('workspace.error.workspaceIsStale', {
                  defaultMessage: 'Cannot find current workspace since it is stale',
                })
              : reason
          );
        }
      },
    });
  }

  stop() {
    this.workspaceValidationSubscription?.unsubscribe();
  }
}
