/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspaceFormError, WorkspacePermissionSetting } from './types';
import {
  WorkspacePermissionItemType,
  optionIdToWorkspacePermissionModesMap,
  PermissionModeId,
} from './constants';
import {
  WorkspacePermissionSettingInput,
  WorkspacePermissionSettingInputProps,
} from './workspace_permission_setting_input';
import { generateNextPermissionSettingsId } from './utils';

export interface WorkspacePermissionSettingPanelProps {
  errors?: { [key: number]: WorkspaceFormError };
  disabledUserOrGroupInputIds: number[];
  permissionSettings: Array<
    Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>
  >;
  onChange?: (
    value: Array<Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>>
  ) => void;
  isEditing?: boolean;
}

export const WorkspacePermissionSettingPanel = ({
  errors,
  onChange,
  isEditing = true,
  permissionSettings,
  disabledUserOrGroupInputIds,
}: WorkspacePermissionSettingPanelProps) => {
  const nextIdRef = useRef(generateNextPermissionSettingsId(permissionSettings));

  const handlePermissionSettingsChange = useCallback(
    (newSettings) => {
      onChange?.([...newSettings]);
    },
    [onChange]
  );

  const nextIdGenerator = useCallback(() => {
    const nextId = nextIdRef.current;
    nextIdRef.current++;
    return nextId;
  }, []);

  useEffect(() => {
    nextIdRef.current = Math.max(
      nextIdRef.current,
      generateNextPermissionSettingsId(permissionSettings)
    );
  }, [permissionSettings]);

  // default permission mode is read
  const handleAddNewOne = useCallback(() => {
    handlePermissionSettingsChange?.([
      ...permissionSettings,
      {
        id: nextIdGenerator(),
        type: WorkspacePermissionItemType.User,
        modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
      },
    ]);
  }, [handlePermissionSettingsChange, permissionSettings, nextIdGenerator]);

  const handleDelete = useCallback(
    (index: number) => {
      handlePermissionSettingsChange?.(
        permissionSettings.filter((_item, itemIndex) => itemIndex !== index)
      );
    },
    [handlePermissionSettingsChange, permissionSettings]
  );

  const handlePermissionModesChange = useCallback<
    WorkspacePermissionSettingInputProps['onPermissionModesChange']
  >(
    (modes, index) => {
      handlePermissionSettingsChange?.(
        permissionSettings.map((item, itemIndex) =>
          index === itemIndex ? { ...item, modes } : item
        )
      );
    },
    [handlePermissionSettingsChange, permissionSettings]
  );

  const handleGroupOrUserIdChange = useCallback<
    WorkspacePermissionSettingInputProps['onGroupOrUserIdChange']
  >(
    (userOrGroupIdWithType, index) => {
      handlePermissionSettingsChange?.(
        permissionSettings.map((item, itemIndex) =>
          index === itemIndex
            ? {
                id: item.id,
                ...userOrGroupIdWithType,
                ...(item.modes ? { modes: item.modes } : {}),
              }
            : item
        )
      );
    },
    [handlePermissionSettingsChange, permissionSettings]
  );

  const handleTypeChange = useCallback<WorkspacePermissionSettingInputProps['onTypeChange']>(
    (type, index) => {
      handlePermissionSettingsChange?.(
        permissionSettings.map((item, itemIndex) =>
          index === itemIndex ? { id: item.id, type, modes: item.modes } : item
        )
      );
    },
    [handlePermissionSettingsChange, permissionSettings]
  );

  return (
    <div>
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem style={{ maxWidth: 150 }}>
          <EuiCompressedFormRow
            label={i18n.translate('workspaceForm.permissionSetting.typeLabel', {
              defaultMessage: 'Type',
            })}
          >
            <></>
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem style={{ maxWidth: 400 }}>
          <EuiCompressedFormRow
            label={i18n.translate('workspaceForm.permissionSetting.collaboratorLabel', {
              defaultMessage: 'Collaborator',
            })}
          >
            <></>
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem style={{ maxWidth: 332 }}>
          <EuiCompressedFormRow
            label={i18n.translate('workspaceForm.permissionSetting.permissionLabel', {
              defaultMessage: 'Access level',
            })}
          >
            <></>
          </EuiCompressedFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xs" />
      {permissionSettings.map((item, index) => (
        <React.Fragment key={item.id}>
          <EuiCompressedFormRow
            fullWidth
            isInvalid={!!errors?.[item.id]}
            error={errors?.[item.id]?.message}
          >
            <WorkspacePermissionSettingInput
              {...item}
              type={item.type || WorkspacePermissionItemType.User}
              index={index}
              userOrGroupDisabled={disabledUserOrGroupInputIds.includes(item.id)}
              onDelete={handleDelete}
              onGroupOrUserIdChange={handleGroupOrUserIdChange}
              onPermissionModesChange={handlePermissionModesChange}
              onTypeChange={handleTypeChange}
              isEditing={isEditing}
            />
          </EuiCompressedFormRow>
        </React.Fragment>
      ))}
      {isEditing && (
        <EuiSmallButton
          fullWidth={false}
          onClick={handleAddNewOne}
          data-test-subj={`workspaceForm-permissionSettingPanel-addNew`}
          color="primary"
          iconType="plusInCircle"
        >
          {i18n.translate('workspace.form.permissionSettingPanel.addCollaborator', {
            defaultMessage: 'Add collaborator',
          })}
        </EuiSmallButton>
      )}
    </div>
  );
};
