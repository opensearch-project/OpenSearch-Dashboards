/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspacePrivacyItemType, privacyType2TextMap, workspacePrivacyTitle } from './constants';
import { WorkspacePermissionSetting } from './types';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { CoreStart, IWorkspaceResponse } from '../../../../../core/public';
import {
  convertPermissionsToPrivacyType,
  getPermissionSettingsWithPrivacyType,
  isWorkspacePermissionSetting,
} from './utils';
import { WorkspacePrivacySettingSelect } from './workspace_privacy_setting_select';

export interface WorkspaceCollaboratorPrivacySettingProps {
  permissionSettings: Array<
    Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>
  >;
  handleSubmitPermissionSettings: (
    permissionSettings: WorkspacePermissionSetting[]
  ) => Promise<IWorkspaceResponse<boolean>>;
}

export const WorkspaceCollaboratorPrivacySettingPanel = ({
  permissionSettings,
  handleSubmitPermissionSettings,
}: WorkspaceCollaboratorPrivacySettingProps) => {
  const {
    services: { notifications },
  } = useOpenSearchDashboards<{
    CoreStart: CoreStart;
  }>();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPrivacyType, setSelectedPrivacyType] = useState(
    WorkspacePrivacyItemType.PrivateToCollaborators
  );

  const privacyType = useMemo(() => convertPermissionsToPrivacyType(permissionSettings), [
    permissionSettings,
  ]);

  const handleModalOpen = () => {
    setSelectedPrivacyType(privacyType);
    setIsOpen(true);
  };

  const handleChange = async () => {
    let result;
    try {
      result = await handleSubmitPermissionSettings(
        getPermissionSettingsWithPrivacyType(permissionSettings, selectedPrivacyType).filter(
          isWorkspacePermissionSetting
        )
      );
    } catch (error) {
      notifications?.toasts?.addError(error, {
        title: i18n.translate('workspace.collaborator.changePrivacyType.failed.message', {
          defaultMessage: `Error updating workspace privacy type`,
        }),
      });
      return;
    }
    if (result?.success) {
      notifications?.toasts?.addSuccess({
        title: i18n.translate('workspace.collaborator.changePrivacyType.success.message', {
          defaultMessage: `Change workspace privacy successfully.`,
        }),
      });
    }
    setIsOpen(false);
  };

  return (
    <EuiPanel>
      <EuiFlexGroup justifyContent="flexStart" alignItems="baseline" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiText size="s">
            <h3>{workspacePrivacyTitle}</h3>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            data-test-subj="workspaceCollaborators-privacySetting-edit"
            size="xs"
            onClick={handleModalOpen}
          >
            {i18n.translate('workspace.form.collaborators.panels.privacy.edit', {
              defaultMessage: 'Edit',
            })}
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xs" />
      <EuiText size="xs">
        {i18n.translate('workspace.form.collaborators.panels.privacy.description', {
          defaultMessage: '{title} ({description})',
          values: {
            title: privacyType2TextMap[privacyType].title,
            description: privacyType2TextMap[privacyType].description,
          },
        })}
      </EuiText>
      {isOpen && (
        <EuiModal onClose={() => setIsOpen(false)}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>{workspacePrivacyTitle}</EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <WorkspacePrivacySettingSelect
              selectedPrivacyType={selectedPrivacyType}
              onSelectedPrivacyTypeChange={setSelectedPrivacyType}
            />
          </EuiModalBody>
          <EuiModalFooter>
            <EuiSmallButtonEmpty onClick={() => setIsOpen(false)}>
              {i18n.translate('workspace.form.collaborators.panels.privacy.modal.cancel', {
                defaultMessage: 'Cancel',
              })}
            </EuiSmallButtonEmpty>
            <EuiSmallButton
              onClick={handleChange}
              fill
              disabled={selectedPrivacyType === privacyType}
              data-test-subj="workspaceCollaborators-privacySetting-save"
            >
              {i18n.translate('workspace.form.collaborators.panels.privacy.modal.save', {
                defaultMessage: 'Save changes',
              })}
            </EuiSmallButton>
          </EuiModalFooter>
        </EuiModal>
      )}
    </EuiPanel>
  );
};
