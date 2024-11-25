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
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSpacer,
  EuiSuperSelect,
  EuiText,
} from '@elastic/eui';
import _ from 'lodash';
import { i18n } from '@osd/i18n';
import {
  privacyTypeEditDescription,
  privacyTypeEditTitle,
  privacyTypePrivateDescription,
  privacyTypePrivateTitle,
  privacyTypeViewDescription,
  privacyTypeViewTitle,
  WorkspacePermissionItemType,
  WorkspacePrivacyItemType,
  optionIdToWorkspacePermissionModesMap,
} from './constants';
import { WorkspacePermissionSetting } from './types';
import { WorkspacePermissionMode } from '../../../common/constants';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { CoreStart, IWorkspaceResponse } from '../../../../../core/public';
import { PermissionModeId } from '../../../../../core/public';

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
  const options = [
    {
      value: WorkspacePrivacyItemType.PrivateToCollaborators,
      inputDisplay: privacyTypePrivateTitle,
      dropdownDisplay: (
        <>
          <EuiText>{privacyTypePrivateTitle}</EuiText>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="subdued">
            {privacyTypePrivateDescription}
          </EuiText>
        </>
      ),
    },
    {
      value: WorkspacePrivacyItemType.AnyoneCanView,
      inputDisplay: privacyTypeViewTitle,
      dropdownDisplay: (
        <>
          <EuiText>{privacyTypeViewTitle}</EuiText>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="subdued">
            {privacyTypeViewDescription}
          </EuiText>
        </>
      ),
    },
    {
      value: WorkspacePrivacyItemType.AnyoneCanEdit,
      inputDisplay: privacyTypeEditTitle,
      dropdownDisplay: (
        <>
          <EuiText>{privacyTypeEditTitle}</EuiText>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="subdued">
            {privacyTypeEditDescription}
          </EuiText>
        </>
      ),
    },
  ];

  const privacyType = useMemo(() => {
    const modes = permissionSettings.find(
      (item) => item.type === WorkspacePermissionItemType.User && item.userId === '*'
    )?.modes;
    if (modes) {
      return modes.includes(WorkspacePermissionMode.LibraryRead)
        ? WorkspacePrivacyItemType.AnyoneCanView
        : WorkspacePrivacyItemType.AnyoneCanEdit;
    }

    return WorkspacePrivacyItemType.PrivateToCollaborators;
  }, [permissionSettings]);

  const handleModalOpen = () => {
    setSelectedPrivacyType(privacyType);
    setIsOpen(true);
  };

  const successfulMessage = {
    title: i18n.translate('workspace.collaborator.changePrivacyType.success.message', {
      defaultMessage: `Change workspace privacy successfully.`,
    }),
  };

  const handleChange = async () => {
    if (selectedPrivacyType === WorkspacePrivacyItemType.PrivateToCollaborators) {
      let newSettings = permissionSettings;
      newSettings = newSettings.filter(
        (item) => !(item.type === WorkspacePermissionItemType.User && item.userId === '*')
      );
      const result = await handleSubmitPermissionSettings(
        newSettings as WorkspacePermissionSetting[]
      );
      if (result?.success) {
        notifications?.toasts?.addSuccess(successfulMessage);
      }
    }
    if (selectedPrivacyType === WorkspacePrivacyItemType.AnyoneCanView) {
      let newSettings = permissionSettings;
      newSettings = newSettings.filter(
        (item) => !(item.type === WorkspacePermissionItemType.User && item.userId === '*')
      );
      newSettings.push({
        id: newSettings.length,
        type: WorkspacePermissionItemType.User,
        userId: '*',
        modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
      });
      const result = await handleSubmitPermissionSettings(
        newSettings as WorkspacePermissionSetting[]
      );
      if (result?.success) {
        notifications?.toasts?.addSuccess(successfulMessage);
      }
    }
    if (selectedPrivacyType === WorkspacePrivacyItemType.AnyoneCanEdit) {
      let newSettings = permissionSettings;
      newSettings = newSettings.filter(
        (item) => !(item.type === WorkspacePermissionItemType.User && item.userId === '*')
      );
      newSettings.push({
        id: newSettings.length,
        type: WorkspacePermissionItemType.User,
        userId: '*',
        modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.ReadAndWrite],
      });
      const result = await handleSubmitPermissionSettings(
        newSettings as WorkspacePermissionSetting[]
      );
      if (result?.success) {
        notifications?.toasts?.addSuccess(successfulMessage);
      }
    }
    setIsOpen(false);
  };

  return (
    <EuiPanel>
      <EuiFlexGroup justifyContent="flexStart" gutterSize="s">
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
        {privacyType === WorkspacePrivacyItemType.PrivateToCollaborators
          ? `${privacyTypePrivateTitle} (${privacyTypePrivateDescription})`
          : privacyType === WorkspacePrivacyItemType.AnyoneCanView
          ? `${privacyTypeViewTitle} (${privacyTypeViewDescription})`
          : `${privacyTypeEditTitle} (${privacyTypeEditDescription})`}
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
            <EuiFormRow
              label={i18n.translate('workspace.form.collaborators.panels.privacy.modal.label', {
                defaultMessage: 'Workspace Privacy',
              })}
            >
              <EuiSuperSelect
                compressed
                hasDividers
                options={options}
                valueOfSelected={selectedPrivacyType}
                onChange={(value) => setSelectedPrivacyType(value)}
              />
            </EuiFormRow>
            <EuiText size="xs" color="subdued" style={{ paddingLeft: '2px' }}>
              {selectedPrivacyType === WorkspacePrivacyItemType.PrivateToCollaborators
                ? privacyTypePrivateDescription
                : privacyType === WorkspacePrivacyItemType.AnyoneCanView
                ? privacyTypeViewDescription
                : privacyTypeEditDescription}
            </EuiText>
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
