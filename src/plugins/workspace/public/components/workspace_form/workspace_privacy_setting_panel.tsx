/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  EuiCheckableCard,
  EuiCheckbox,
  EuiCompressedFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  optionIdToWorkspacePermissionModesMap,
  privacyTypeEditDescription,
  privacyTypeEditTitle,
  privacyTypePrivateDescription,
  privacyTypePrivateTitle,
  privacyTypeViewDescription,
  privacyTypeViewTitle,
  WorkspacePermissionItemType,
  WorkspacePrivacyItemType,
} from './constants';
import { WorkspacePermissionSetting } from './types';
import { PermissionModeId } from '../../../../../core/public';

export interface WorkspacePrivacySettingProps {
  onPermissionChange: (
    value: Array<Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>>
  ) => void;
  permissionSettings: Array<
    Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>
  >;
  goToCollaborators: boolean;
  onGoToCollaboratorsChange: (value: boolean) => void;
}

export const WorkspacePrivacySettingPanel = ({
  onPermissionChange,
  permissionSettings,
  goToCollaborators,
  onGoToCollaboratorsChange,
}: WorkspacePrivacySettingProps) => {
  const [privacyType, setPrivacyType] = useState(WorkspacePrivacyItemType.PrivateToCollaborators);
  const workspaceAdmin = permissionSettings[0];

  const options = [
    {
      id: WorkspacePrivacyItemType.PrivateToCollaborators,
      label: privacyTypePrivateTitle,
      description: privacyTypePrivateDescription,
    },
    {
      id: WorkspacePrivacyItemType.AnyoneCanView,
      label: privacyTypeViewTitle,
      description: privacyTypeViewDescription,
    },
    {
      id: WorkspacePrivacyItemType.AnyoneCanEdit,
      label: privacyTypeEditTitle,
      description: privacyTypeEditDescription,
    },
  ];

  useEffect(() => {
    if (privacyType === WorkspacePrivacyItemType.PrivateToCollaborators) {
      onPermissionChange([workspaceAdmin]);
    }
    if (privacyType === WorkspacePrivacyItemType.AnyoneCanView) {
      onPermissionChange([
        workspaceAdmin,
        {
          id: 1,
          type: WorkspacePermissionItemType.User,
          userId: '*',
          modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
        },
      ]);
    }
    if (privacyType === WorkspacePrivacyItemType.AnyoneCanEdit) {
      onPermissionChange([
        workspaceAdmin,
        {
          id: 1,
          type: WorkspacePermissionItemType.User,
          userId: '*',
          modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.ReadAndWrite],
        },
      ]);
    }
  }, [privacyType, onPermissionChange, workspaceAdmin]);

  return (
    <EuiPanel>
      <EuiText size="s">
        <h2>
          {i18n.translate('workspace.form.panels.privacy.title', {
            defaultMessage: 'Set up privacy',
          })}
        </h2>
      </EuiText>
      <EuiText size="xs">
        {i18n.translate('workspace.form.panels.privacy.description', {
          defaultMessage: 'Who has access to the workspace',
        })}
      </EuiText>
      <EuiSpacer size="m" />
      <EuiCompressedFormRow
        label={i18n.translate('workspace.form.privacy.name.label', {
          defaultMessage: 'Workspace privacy',
        })}
        // isInvalid={!!formErrors.features}
        // error={formErrors.features?.message}
        fullWidth
      >
        <EuiFlexGroup gutterSize="s">
          {options.map(({ id, label, description }) => (
            <EuiFlexItem key={id}>
              <EuiCheckableCard
                id={id}
                label={
                  <EuiText size="s">
                    <h4>{label}</h4>
                  </EuiText>
                }
                onChange={() => setPrivacyType(id)}
                checked={privacyType === id}
              >
                <EuiText size="xs">{description}</EuiText>
              </EuiCheckableCard>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </EuiCompressedFormRow>
      <EuiSpacer size="m" />
      <EuiText size="s">
        {i18n.translate('workspace.form.panels.privacy.jumpToCollaborators.description', {
          defaultMessage: 'You can assign workspace administrators once the workspace is created.',
        })}
      </EuiText>
      <EuiSpacer size="m" />
      <EuiCheckbox
        id="jump_to_collaborators_checkbox"
        checked={goToCollaborators}
        onChange={(event) => onGoToCollaboratorsChange(event.target.checked)}
        label={i18n.translate('workspace.form.panels.privacy.jumpToCollaborators.label', {
          defaultMessage: 'Go to configure the collaborators right after creating the workspace.',
        })}
      />
    </EuiPanel>
  );
};
