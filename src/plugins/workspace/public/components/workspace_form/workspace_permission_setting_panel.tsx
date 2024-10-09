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
  EuiFormLabel,
  EuiButtonIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspaceFormError, WorkspacePermissionSetting } from './types';
import {
  WorkspacePermissionItemType,
  optionIdToWorkspacePermissionModesMap,
  PERMISSION_TYPE_LABEL_ID,
  PERMISSION_COLLABORATOR_LABEL_ID,
  PERMISSION_ACCESS_LEVEL_LABEL_ID,
} from './constants';
import {
  WorkspacePermissionSettingInput,
  WorkspacePermissionSettingInputProps,
} from './workspace_permission_setting_input';
import { generateNextPermissionSettingsId } from './utils';
import { PermissionModeId } from '../../../../../core/public';

export interface WorkspacePermissionSettingPanelProps {
  errors?: { [key: number]: WorkspaceFormError };
  disabledUserOrGroupInputIds: number[];
  permissionSettings: Array<
    Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>
  >;
  onChange?: (
    value: Array<Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>>
  ) => void;
  readOnly?: boolean;
}

export const WorkspacePermissionSettingPanel = ({
  errors,
  onChange,
  readOnly = false,
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
    <>
      {permissionSettings.length > 0 && (
        <>
          <EuiFlexGroup alignItems="center" gutterSize="s">
            <EuiFlexItem style={{ maxWidth: 150 }}>
              <EuiFormLabel id={PERMISSION_TYPE_LABEL_ID}>
                {i18n.translate('workspace.form.permissionSetting.typeLabel', {
                  defaultMessage: 'Type',
                })}
              </EuiFormLabel>
            </EuiFlexItem>
            <EuiFlexItem style={{ maxWidth: 400 }}>
              <EuiFormLabel id={PERMISSION_COLLABORATOR_LABEL_ID}>
                {i18n.translate('workspace.form.permissionSetting.collaboratorLabel', {
                  defaultMessage: 'Collaborator',
                })}
              </EuiFormLabel>
            </EuiFlexItem>
            <EuiFlexItem style={{ maxWidth: 150 }}>
              <EuiFormLabel id={PERMISSION_ACCESS_LEVEL_LABEL_ID}>
                {i18n.translate('workspace.form.permissionSetting.accessLevelLabel', {
                  defaultMessage: 'Access level',
                })}
              </EuiFormLabel>
            </EuiFlexItem>
            {/* Placeholder to vertically align form labels with their respective inputs */}
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                color="text"
                iconType="trash"
                size="xs"
                style={{ visibility: 'hidden' }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="xs" />
        </>
      )}
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
              readOnly={readOnly}
            />
          </EuiCompressedFormRow>
        </React.Fragment>
      ))}
      {!readOnly && (
        <EuiCompressedFormRow fullWidth>
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
        </EuiCompressedFormRow>
      )}
    </>
  );
};
