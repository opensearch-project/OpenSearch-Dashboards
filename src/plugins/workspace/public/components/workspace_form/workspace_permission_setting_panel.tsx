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
}

interface UserOrGroupSectionProps extends WorkspacePermissionSettingPanelProps {
  // type: WorkspacePermissionItemType;
  nextIdGenerator: () => number;
}

const UserOrGroupSection = ({
  // type,
  errors,
  onChange,
  nextIdGenerator,
  permissionSettings,
  disabledUserOrGroupInputIds,
}: UserOrGroupSectionProps) => {
  // default permission mode is read
  const handleAddNewOne = useCallback(() => {
    onChange?.([
      ...permissionSettings,
      {
        id: nextIdGenerator(),
        type: WorkspacePermissionItemType.User,
        modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
      },
    ]);
  }, [onChange, permissionSettings, nextIdGenerator]);

  const handleDelete = useCallback(
    (index: number) => {
      onChange?.(permissionSettings.filter((_item, itemIndex) => itemIndex !== index));
    },
    [onChange, permissionSettings]
  );

  const handlePermissionModesChange = useCallback<
    WorkspacePermissionSettingInputProps['onPermissionModesChange']
  >(
    (modes, index) => {
      onChange?.(
        permissionSettings.map((item, itemIndex) =>
          index === itemIndex ? { ...item, modes } : item
        )
      );
    },
    [onChange, permissionSettings]
  );

  const handleGroupOrUserIdChange = useCallback<
    WorkspacePermissionSettingInputProps['onGroupOrUserIdChange']
  >(
    (userOrGroupIdWithType, index) => {
      onChange?.(
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
    [onChange, permissionSettings]
  );

  const handleTypeChange = useCallback<WorkspacePermissionSettingInputProps['onTypeChange']>(
    (type, index) => {
      onChange?.(
        permissionSettings.map((item, itemIndex) => {
          if (index === itemIndex) {
            if (type === WorkspacePermissionItemType.User) {
              const { group, ...newItem } = { ...item, type, userId: '', group: '' };
              return newItem;
            } else {
              const { userId, ...newItem } = { ...item, type, userId: '', group: '' };
              return newItem;
            }
          }
          return item;
        })
      );
    },
    [onChange, permissionSettings]
  );

  return (
    <div>
      <EuiFlexGroup gutterSize="m">
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
            />
          </EuiCompressedFormRow>
        </React.Fragment>
      ))}
      <EuiSmallButton
        fullWidth={false}
        onClick={handleAddNewOne}
        // data-test-subj={`workspaceForm-permissionSettingPanel-${type}-addNew`}
        color="secondary"
      >
        {i18n.translate('workspace.form.permissionSettingPanel.addCollaborator', {
          defaultMessage: 'Add collaborator',
        })}
      </EuiSmallButton>
    </div>
  );
};

export const WorkspacePermissionSettingPanel = ({
  errors,
  onChange,
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

  return (
    <div>
      <UserOrGroupSection
        errors={errors}
        onChange={handlePermissionSettingsChange}
        permissionSettings={permissionSettings}
        nextIdGenerator={nextIdGenerator}
        disabledUserOrGroupInputIds={disabledUserOrGroupInputIds}
      />
    </div>
  );
};
