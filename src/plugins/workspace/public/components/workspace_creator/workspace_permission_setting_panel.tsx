/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  EuiFlexGroup,
  EuiComboBox,
  EuiFlexItem,
  EuiButton,
  EuiButtonIcon,
  EuiButtonGroup,
  EuiFormRow,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspacePermissionMode } from '../../../../../core/public';

export enum WorkspacePermissionItemType {
  User = 'user',
  Group = 'group',
}

export type WorkspacePermissionSetting =
  | { type: WorkspacePermissionItemType.User; userId: string; modes: WorkspacePermissionMode[] }
  | { type: WorkspacePermissionItemType.Group; group: string; modes: WorkspacePermissionMode[] };

enum PermissionModeId {
  Read = 'read',
  ReadAndWrite = 'read+write',
  Admin = 'admin',
}

const permissionModeOptions = [
  {
    id: PermissionModeId.Read,
    label: i18n.translate('workspace.form.permissionSettingPanel.permissionModeOptions.read', {
      defaultMessage: 'Read',
    }),
  },
  {
    id: PermissionModeId.ReadAndWrite,
    label: i18n.translate(
      'workspace.form.permissionSettingPanel.permissionModeOptions.readAndWrite',
      {
        defaultMessage: 'Read & Write',
      }
    ),
  },
  {
    id: PermissionModeId.Admin,
    label: i18n.translate('workspace.form.permissionSettingPanel.permissionModeOptions.admin', {
      defaultMessage: 'Admin',
    }),
  },
];

const optionIdToWorkspacePermissionModesMap: {
  [key: string]: WorkspacePermissionMode[];
} = {
  [PermissionModeId.Read]: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
  [PermissionModeId.ReadAndWrite]: [
    WorkspacePermissionMode.LibraryWrite,
    WorkspacePermissionMode.Read,
  ],
  [PermissionModeId.Admin]: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
};

const generateWorkspacePermissionItemKey = (
  item: Partial<WorkspacePermissionSetting>,
  index?: number
) =>
  [
    ...(item.type ?? []),
    ...(item.type === WorkspacePermissionItemType.User ? [item.userId] : []),
    ...(item.type === WorkspacePermissionItemType.Group ? [item.group] : []),
    ...(item.modes ?? []),
    index,
  ].join('-');

// default permission mode is read
const getPermissionModeId = (modes: WorkspacePermissionMode[]) => {
  for (const key in optionIdToWorkspacePermissionModesMap) {
    if (optionIdToWorkspacePermissionModesMap[key].every((mode) => modes?.includes(mode))) {
      return key;
    }
  }
  return PermissionModeId.Read;
};

interface WorkspacePermissionSettingInputProps {
  index: number;
  deletable: boolean;
  type: WorkspacePermissionItemType;
  userId?: string;
  group?: string;
  modes?: WorkspacePermissionMode[];
  onGroupOrUserIdChange: (
    groupOrUserId:
      | { type: WorkspacePermissionItemType.User; userId?: string }
      | { type: WorkspacePermissionItemType.Group; group?: string },
    index: number
  ) => void;
  onPermissionModesChange: (
    WorkspacePermissionMode: WorkspacePermissionMode[],
    index: number
  ) => void;
  onDelete: (index: number) => void;
}

const WorkspacePermissionSettingInput = ({
  index,
  deletable,
  type,
  userId,
  group,
  modes,
  onDelete,
  onGroupOrUserIdChange,
  onPermissionModesChange,
}: WorkspacePermissionSettingInputProps) => {
  const groupOrUserIdSelectedOptions = useMemo(
    () => (group || userId ? [{ label: (group || userId) as string }] : []),
    [group, userId]
  );

  const permissionModesSelectedId = useMemo(() => getPermissionModeId(modes ?? []), [modes]);
  const handleGroupOrUserIdCreate = useCallback(
    (groupOrUserId) => {
      onGroupOrUserIdChange(
        type === WorkspacePermissionItemType.Group
          ? { type, group: groupOrUserId }
          : { type, userId: groupOrUserId },
        index
      );
    },
    [index, type, onGroupOrUserIdChange]
  );

  const handleGroupOrUserIdChange = useCallback(
    (options) => {
      if (options.length === 0) {
        onGroupOrUserIdChange({ type }, index);
      }
    },
    [index, type, onGroupOrUserIdChange]
  );

  const handlePermissionModeOptionChange = useCallback(
    (id: string) => {
      if (optionIdToWorkspacePermissionModesMap[id]) {
        onPermissionModesChange([...optionIdToWorkspacePermissionModesMap[id]], index);
      }
    },
    [index, onPermissionModesChange]
  );

  const handleDelete = useCallback(() => {
    onDelete(index);
  }, [index, onDelete]);

  return (
    <EuiFlexGroup alignItems="center" gutterSize="l">
      <EuiFlexItem>
        <EuiComboBox
          singleSelection
          selectedOptions={groupOrUserIdSelectedOptions}
          onCreateOption={handleGroupOrUserIdCreate}
          onChange={handleGroupOrUserIdChange}
          placeholder="Select"
          style={{ width: 200 }}
          data-test-subj={`workspaceForm-permissionSettingPanel-${index}-userId`}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonGroup
          type="single"
          isDisabled={!deletable}
          legend="Permission Modes"
          options={permissionModeOptions}
          idSelected={permissionModesSelectedId}
          onChange={handlePermissionModeOptionChange}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          color="danger"
          aria-label="Delete permission setting"
          iconType="trash"
          display="base"
          size="m"
          onClick={handleDelete}
          isDisabled={!deletable}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

interface WorkspacePermissionSettingPanelProps {
  errors?: string[];
  firstUserDeletable?: boolean;
  permissionSettings: Array<Partial<WorkspacePermissionSetting>>;
  onChange?: (value: Array<Partial<WorkspacePermissionSetting>>) => void;
}

interface UserOrGroupSectionProps extends WorkspacePermissionSettingPanelProps {
  title: string;
  type: WorkspacePermissionItemType;
}

const UserOrGroupSection = ({
  type,
  title,
  errors,
  onChange,
  permissionSettings,
  firstUserDeletable,
}: UserOrGroupSectionProps) => {
  const transformedValue = useMemo(() => {
    if (!permissionSettings) {
      return [];
    }
    const result: Array<Partial<WorkspacePermissionSetting>> = [];
    /**
     * One workspace permission setting may include multi setting options,
     * for loop the workspace permission setting array to separate it to multi rows.
     **/
    for (let i = 0; i < permissionSettings.length; i++) {
      const valueItem = permissionSettings[i];
      // Incomplete workspace permission setting don't need to separate to multi rows
      if (
        !valueItem.modes ||
        !valueItem.type ||
        (valueItem.type === 'user' && !valueItem.userId) ||
        (valueItem.type === 'group' && !valueItem.group)
      ) {
        result.push(valueItem);
        continue;
      }
      /**
       * For loop the option id to workspace permission modes map,
       * if one settings includes all permission modes in a specific option,
       * add these permission modes to the result array.
       */
      for (const key in optionIdToWorkspacePermissionModesMap) {
        if (!Object.prototype.hasOwnProperty.call(optionIdToWorkspacePermissionModesMap, key)) {
          continue;
        }
        const modesForCertainPermissionId = optionIdToWorkspacePermissionModesMap[key];
        if (modesForCertainPermissionId.every((mode) => valueItem.modes?.includes(mode))) {
          result.push({ ...valueItem, modes: modesForCertainPermissionId });
        }
      }
    }
    return result;
  }, [permissionSettings]);

  // default permission mode is read
  const handleAddNewOne = useCallback(() => {
    onChange?.([
      ...(transformedValue ?? []),
      { type, modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read] },
    ]);
  }, [onChange, type, transformedValue]);

  const handleDelete = useCallback(
    (index: number) => {
      onChange?.((transformedValue ?? []).filter((_item, itemIndex) => itemIndex !== index));
    },
    [onChange, transformedValue]
  );

  const handlePermissionModesChange = useCallback<
    WorkspacePermissionSettingInputProps['onPermissionModesChange']
  >(
    (modes, index) => {
      onChange?.(
        (transformedValue ?? []).map((item, itemIndex) =>
          index === itemIndex ? { ...item, modes } : item
        )
      );
    },
    [onChange, transformedValue]
  );

  const handleGroupOrUserIdChange = useCallback<
    WorkspacePermissionSettingInputProps['onGroupOrUserIdChange']
  >(
    (userOrGroupIdWithType, index) => {
      onChange?.(
        (transformedValue ?? []).map((item, itemIndex) =>
          index === itemIndex
            ? { ...userOrGroupIdWithType, ...(item.modes ? { modes: item.modes } : {}) }
            : item
        )
      );
    },
    [onChange, transformedValue]
  );

  // assume that group items are always deletable
  return (
    <div>
      <EuiText>
        <strong>{title}</strong>
      </EuiText>
      <EuiSpacer size="s" />
      {transformedValue?.map((item, index) => (
        <React.Fragment key={generateWorkspacePermissionItemKey(item, index)}>
          <EuiFormRow isInvalid={!!errors?.[index]} error={errors?.[index]}>
            <WorkspacePermissionSettingInput
              {...item}
              type={type}
              index={index}
              deletable={
                type === WorkspacePermissionItemType.Group || firstUserDeletable || index !== 0
              }
              onDelete={handleDelete}
              onGroupOrUserIdChange={handleGroupOrUserIdChange}
              onPermissionModesChange={handlePermissionModesChange}
            />
          </EuiFormRow>
        </React.Fragment>
      ))}
      <EuiButton
        fill
        fullWidth={false}
        onClick={handleAddNewOne}
        data-test-subj={`workspaceForm-permissionSettingPanel-${type}-addNew`}
      >
        {i18n.translate('workspace.form.permissionSettingPanel.addNew', {
          defaultMessage: 'Add New',
        })}
      </EuiButton>
    </div>
  );
};

export const WorkspacePermissionSettingPanel = ({
  errors,
  onChange,
  permissionSettings,
  firstUserDeletable,
}: WorkspacePermissionSettingPanelProps) => {
  const [userPermissionSettings, setUserPermissionSettings] = useState<
    Array<Partial<WorkspacePermissionSetting>>
  >(
    permissionSettings?.filter(
      (permissionSettingItem) => permissionSettingItem.type === WorkspacePermissionItemType.User
    ) ?? []
  );
  const [groupPermissionSettings, setGroupPermissionSettings] = useState<
    Array<Partial<WorkspacePermissionSetting>>
  >(
    permissionSettings?.filter(
      (permissionSettingItem) => permissionSettingItem.type === WorkspacePermissionItemType.Group
    ) ?? []
  );

  useEffect(() => {
    onChange?.([...userPermissionSettings, ...groupPermissionSettings]);
  }, [onChange, userPermissionSettings, groupPermissionSettings]);

  return (
    <div>
      <UserOrGroupSection
        title={i18n.translate('workspace.form.permissionSettingPanel.userTitle', {
          defaultMessage: 'User',
        })}
        errors={errors}
        onChange={setUserPermissionSettings}
        permissionSettings={userPermissionSettings}
        firstUserDeletable={firstUserDeletable}
        type={WorkspacePermissionItemType.User}
      />
      <EuiSpacer size="s" />
      <UserOrGroupSection
        title={i18n.translate('workspace.form.permissionSettingPanel.userGroupTitle', {
          defaultMessage: 'User Groups',
        })}
        errors={errors}
        onChange={setGroupPermissionSettings}
        permissionSettings={groupPermissionSettings}
        type={WorkspacePermissionItemType.Group}
      />
    </div>
  );
};
