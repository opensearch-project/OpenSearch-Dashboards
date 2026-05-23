/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { EuiPage, EuiPanel, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../../core/public';
import {
  NavigationPublicPluginStart,
  TopNavControlDescriptionData,
  TopNavControlLinkData,
} from '../../../../navigation/public';
import { WorkspacePermissionSetting } from '../workspace_form/types';
import { WorkspaceCollaboratorTable } from '../workspace_form/workspace_collaborator_table';
import { WorkspaceCollaboratorTypesService } from '../../services/workspace_collaborator_types_service';
import { AddCollaboratorButton } from '../workspace_form/add_collaborator_button';
import {
  convertPermissionSettingsToPermissions,
  convertPermissionsToPermissionSettings,
} from '../workspace_form';
import {
  SavedObjectPermissions,
  WorkspaceAttributeWithPermission,
} from '../../../../../core/types';
import { WorkspaceClient } from '../../workspace_client';
import { WorkspacePrivacyFlyout } from '../workspace_form/workspace_privacy_flyout';
import { WorkspaceCollaboratorPrivacySettingPanel } from '../workspace_form/workspace_collaborator_privacy_setting_panel';

export const WorkspaceCollaborators = () => {
  const {
    services: {
      workspaces,
      application,
      navigationUI: { HeaderControl },
      workspaceClient,
      collaboratorTypes,
      notifications,
    },
  } = useOpenSearchDashboards<{
    CoreStart: CoreStart;
    navigationUI: NavigationPublicPluginStart['ui'];
    collaboratorTypes: WorkspaceCollaboratorTypesService;
    workspaceClient: WorkspaceClient;
  }>();

  const [isPrivacyFlyoutVisible, setIsPrivacyFlyoutVisible] = useState(false);
  const displayedCollaboratorTypes = useObservable(collaboratorTypes.getTypes$()) ?? [];

  const currentWorkspace = useObservable(
    workspaces ? workspaces.currentWorkspace$ : of(null)
  ) as WorkspaceAttributeWithPermission;

  /**
   * The permissions stored in `currentWorkspace$` are populated once at app boot via
   * `WorkspaceClient.init()` and only refreshed after the local user mutates a workspace.
   * If a different user (e.g. an admin) revokes this user's access remotely, the cached
   * value remains stale until the page is hard reloaded, and the collaborator list shown
   * here would still display the previous state.
   *
   * To always reflect server-side truth, fetch the workspace on mount (and when the
   * workspace id changes) and drive the rendered permission list from that response.
   */
  const [latestPermissions, setLatestPermissions] = useState<SavedObjectPermissions | undefined>();
  const permissionSettings = convertPermissionsToPermissionSettings(
    latestPermissions ?? currentWorkspace?.permissions ?? {}
  );

  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;

  useEffect(() => {
    if (!currentWorkspace?.id || !workspaces) {
      return;
    }
    let cancelled = false;
    workspaceClient
      .get(currentWorkspace.id)
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (response.success) {
          setLatestPermissions(response.result.permissions ?? {});
        } else {
          // The user no longer has access to this workspace (e.g. another admin
          // revoked their permissions while this tab was open). Surface the
          // error via the same channel that WorkspaceValidationService uses for
          // stale workspaces so the user is redirected to the fatal-error app
          // instead of seeing a stale collaborator list.
          workspaces.workspaceError$.next(response.error ?? 'Workspace is no longer accessible');
        }
      })
      // eslint-disable-next-line no-console
      .catch((error) => console.warn('Failed to refresh workspace collaborators', error));
    return () => {
      cancelled = true;
    };
  }, [currentWorkspace?.id, workspaceClient, workspaces]);

  const handleSubmitPermissionSettings = async (settings: WorkspacePermissionSetting[]) => {
    const showErrorNotification = (errorText?: string) => {
      notifications?.toasts.addDanger({
        title: i18n.translate('workspace.collaborators.update.failed.message', {
          defaultMessage: 'Failed to update workspace collaborators',
        }),
        ...(errorText ? { text: errorText } : {}),
      });
    };

    try {
      const nextPermissions = convertPermissionSettingsToPermissions(settings);
      const result = await workspaceClient.update(
        currentWorkspace.id,
        {},
        { permissions: nextPermissions }
      );

      if (!result.success) {
        showErrorNotification(result.error);
      } else {
        // The server has just persisted these permissions, so reflect them locally
        // without a redundant round-trip via workspaceClient.get(...).
        setLatestPermissions(nextPermissions);
      }
      return result;
    } catch (error) {
      showErrorNotification(error instanceof Error ? error.message : JSON.stringify(error));
      return {
        success: false as const,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      };
    }
  };

  if (!currentWorkspace || !isPermissionEnabled) {
    return null;
  }

  const handleLearnMoreClick = (targetElement: HTMLElement) => {
    setIsPrivacyFlyoutVisible((value) => !value);
  };
  return (
    <EuiPage data-test-subj="workspace-collaborators-panel">
      <HeaderControl
        controls={[
          {
            description: i18n.translate('workspace.collaborators.description', {
              defaultMessage: 'Manage workspace access and permissions.',
            }),
            links: {
              label: i18n.translate('workspace.form.panels.collaborator.learnMore', {
                defaultMessage: 'Learn more',
              }),
              controlType: 'link',
              run: handleLearnMoreClick,
            } as TopNavControlLinkData,
          } as TopNavControlDescriptionData,
        ]}
        setMountPoint={application.setAppDescriptionControls}
      />
      <HeaderControl
        controls={[
          {
            renderComponent: (
              <AddCollaboratorButton
                permissionSettings={permissionSettings}
                displayedTypes={displayedCollaboratorTypes}
                handleSubmitPermissionSettings={handleSubmitPermissionSettings}
              />
            ),
          },
        ]}
        setMountPoint={application?.setAppRightControls}
      />
      <div>
        <WorkspaceCollaboratorPrivacySettingPanel
          permissionSettings={permissionSettings}
          handleSubmitPermissionSettings={handleSubmitPermissionSettings}
        />
        <EuiSpacer />
        <EuiPanel>
          <WorkspaceCollaboratorTable
            permissionSettings={permissionSettings}
            displayedCollaboratorTypes={displayedCollaboratorTypes}
            handleSubmitPermissionSettings={handleSubmitPermissionSettings}
          />
        </EuiPanel>
      </div>
      {isPrivacyFlyoutVisible && (
        <WorkspacePrivacyFlyout onClose={() => setIsPrivacyFlyoutVisible(false)} />
      )}
    </EuiPage>
  );
};
