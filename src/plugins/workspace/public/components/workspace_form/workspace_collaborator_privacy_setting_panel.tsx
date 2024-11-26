/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import _ from 'lodash';
import { i18n } from '@osd/i18n';
import {
  WorkspacePermissionItemType,
  WorkspacePrivacyItemType,
  optionIdToWorkspacePermissionModesMap,
  privacyType2CopyMap,
} from './constants';
import { WorkspacePermissionSetting } from './types';
import { WorkspacePermissionMode } from '../../../common/constants';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { CoreStart, IWorkspaceResponse } from '../../../../../core/public';
import { PermissionModeId } from '../../../../../core/public';
import {
  generatePermissionSettingsWithPrivacyType,
  getPrivacyTypeFromPermissionSettings,
} from './utils';
import { WorkspacePrivacySettingSelect } from './workspace_privacy_setting_select';

export interface WorkspacePrivacySettingProps {
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
}: WorkspacePrivacySettingProps) => {
  const {
    services: { notifications },
  } = useOpenSearchDashboards<{
    CoreStart: CoreStart;
  }>();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPrivacyType, setSelectedPrivacyType] = useState(
    WorkspacePrivacyItemType.PrivateToCollaborators
  );

  const privacyType = useMemo(() => {
    return getPrivacyTypeFromPermissionSettings(permissionSettings);
  }, [permissionSettings]);

  const handleModalOpen = () => {
    setSelectedPrivacyType(privacyType);
    setIsOpen(true);
  };

  const handleChange = async () => {
    let result;
    try {
      result = await handleSubmitPermissionSettings(
        generatePermissionSettingsWithPrivacyType(
          permissionSettings,
          selectedPrivacyType
        ) as WorkspacePermissionSetting[]
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
            <h3>
              {i18n.translate('workspace.form.collaborators.panels.privacy.title', {
                defaultMessage: 'Workspace privacy',
              })}
            </h3>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="xs" onClick={handleModalOpen}>
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
            title: privacyType2CopyMap[privacyType].title,
            description: privacyType2CopyMap[privacyType].description,
          },
        })}
      </EuiText>
      {isOpen && (
        <EuiModal onClose={() => setIsOpen(false)}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              {i18n.translate('workspace.form.collaborators.panels.privacy.modal.titile', {
                defaultMessage: 'Workspace Privacy',
              })}
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <WorkspacePrivacySettingSelect
              selectedPrivacyType={selectedPrivacyType}
              onSelectedPrivacyTypeChange={setSelectedPrivacyType}
            />
          </EuiModalBody>
          <EuiModalFooter>
            <EuiButtonEmpty onClick={() => setIsOpen(false)}>
              {i18n.translate('workspace.form.collaborators.panels.privacy.modal.cancel', {
                defaultMessage: 'Cancel',
              })}
            </EuiButtonEmpty>
            <EuiButton onClick={handleChange} fill>
              {i18n.translate('workspace.form.collaborators.panels.privacy.modal.save', {
                defaultMessage: 'Save changes',
              })}
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}
    </EuiPanel>
  );
};
