/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { combineLatest, Subscription } from 'rxjs';
import { i18n } from '@osd/i18n';

import { recentWorkspaceManager } from '../recent_workspace_manager';
import { WORKSPACE_DETAIL_APP_ID, WORKSPACE_FATAL_ERROR_APP_ID } from '../../common/constants';
import {
  ApplicationStart,
  ChromeStart,
  CoreSetup,
  CoreStart,
  WorkspaceError,
} from '../../../../core/public';
import { WorkspaceClient } from '../workspace_client';

/**
 * A service to validate workspace entering state by handle triggered workspace errors.
 *
 * This service currently does the following validation:
 * 1) If encounter workspace errors, such as workspace ID not found and workspace ID exsits but
 * staled, redirect to error page with message.
 * 2) If the workspace is validate but currently in error page, redirect to workspace detail page.
 */
export class WorkspaceValidationService {
  private workspaceClient?: WorkspaceClient;
  private workspaceId: string | undefined;
  private workspaceValidationSubscription?: Subscription;

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

  async setup(core: CoreSetup, workspaceId: string) {
    this.workspaceId = workspaceId;

    const workspaceClient = new WorkspaceClient(core.http, core.workspaces);
    await workspaceClient.init();
    core.workspaces.setClient(workspaceClient);
    this.workspaceClient = workspaceClient;

    if (workspaceId) {
      await this.workspaceClient.enterWorkspace(workspaceId);
    }
  }

  async start(core: CoreStart) {
    const { workspaces, application, chrome } = core;

    this.workspaceValidationSubscription = combineLatest([
      workspaces.workspaceError$,
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
          recentWorkspaceManager.addRecentWorkspace(this.workspaceId!);
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
