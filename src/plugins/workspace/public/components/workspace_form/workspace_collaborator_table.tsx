/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiSearchBarProps,
  EuiBasicTableColumn,
  EuiButtonIcon,
  EuiConfirmModal,
  EuiInMemoryTable,
  EuiPopover,
  EuiContextMenu,
  EuiButton,
  EuiTableSelectionType,
  EuiEmptyPrompt,
  EuiContextMenuPanelDescriptor,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspacePermissionSetting } from './types';
import { WorkspacePermissionItemType, permissionModeOptions, typeOptions } from './constants';
import { getPermissionModeId } from './utils';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { AddCollaboratorButton } from './add_collaborator_button';
import { WorkspaceCollaboratorType } from '../../services/workspace_collaborator_types_service';
import {
  WORKSPACE_ACCESS_LEVEL_NAMES,
  accessLevelNameToWorkspacePermissionModesMap,
} from '../../constants';
import { WorkspaceCollaboratorAccessLevel } from '../../types';

export type PermissionSetting = Pick<WorkspacePermissionSetting, 'id'> &
  Partial<WorkspacePermissionSetting>;

interface Props {
  permissionSettings: PermissionSetting[];
  onChange?: (value: PermissionSetting[]) => void;
  displayedCollaboratorTypes: WorkspaceCollaboratorType[];
  handleSubmitPermissionSettings: (permissionSettings: WorkspacePermissionSetting[]) => void;
}

export const WorkspaceCollaboratorTable = ({
  permissionSettings,
  onChange,
  displayedCollaboratorTypes,
  handleSubmitPermissionSettings,
}: Props) => {
  const [selection, setSelection] = useState<PermissionSetting[]>([]);
  const { overlays } = useOpenSearchDashboards();

  const handlePermissionSettingsChange = useCallback(
    (newSettings) => {
      onChange?.([...newSettings]);
    },
    [onChange]
  );
  const items = useMemo(() => {
    return permissionSettings.map((setting) => {
      const basicSettings = {
        ...setting,
        // This is used for table display and search match.
        displayedType:
          typeOptions.find((option) => option.value === setting.type)?.inputDisplay ?? '',
        accessLevel:
          permissionModeOptions.find(
            (option) => option.value === getPermissionModeId(setting.modes ?? [])
          )?.inputDisplay ?? '',
      };
      // Unique primary key and filter null value
      if (setting.type === WorkspacePermissionItemType.User) {
        return {
          ...basicSettings,
          // Id represents the index of the permission setting in the array, will use primaryId for displayed id
          primaryId: setting.userId,
        };
      } else if (setting.type === WorkspacePermissionItemType.Group) {
        return {
          ...basicSettings,
          primaryId: setting.group,
        };
      }
      return basicSettings;
    });
  }, [permissionSettings]);

  const emptyStateMessage = useMemo(() => {
    return (
      <EuiEmptyPrompt
        title={
          <h3>
            {i18n.translate('workspace.workspaceDetail.collaborator.emptyState.title', {
              defaultMessage: 'Your workspace doesn’t have any collaborators.',
            })}
          </h3>
        }
        titleSize="s"
        body={i18n.translate('workspace.workspaceDetail.collaborator.emptyState.body', {
          defaultMessage:
            'Currently you’re the only user who has access to the workspace as an owner. Share this workspace by adding collaborators.',
        })}
        actions={
          <AddCollaboratorButton
            displayedTypes={displayedCollaboratorTypes}
            onChange={handlePermissionSettingsChange}
            permissionSettings={permissionSettings}
            handleSubmitPermissionSettings={handleSubmitPermissionSettings}
          />
        }
      />
    );
  }, [
    displayedCollaboratorTypes,
    permissionSettings,
    handlePermissionSettingsChange,
    handleSubmitPermissionSettings,
  ]);

  const renderToolsLeft = () => {
    if (selection.length === 0) {
      return;
    }

    const onClick = () => {
      const modal = overlays.openModal(
        <EuiConfirmModal
          title={i18n.translate('workspace.detail.collaborator.actions.delete', {
            defaultMessage: 'Delete collaborator',
          })}
          onCancel={() => modal.close()}
          onConfirm={async () => {
            let newSettings = permissionSettings;
            selection.forEach(({ id }) => {
              newSettings = newSettings.filter((_item) => _item.id !== id);
            });
            onChange?.(newSettings);
            handleSubmitPermissionSettings(newSettings as WorkspacePermissionSetting[]);
            setSelection([]);
            modal.close();
          }}
          cancelButtonText="Cancel"
          confirmButtonText="Confirm"
        >
          <EuiText>
            <p>Delete collaborator? The collaborators will not have access to the workspace.</p>
          </EuiText>
        </EuiConfirmModal>
      );
    };

    return (
      <EuiButton color="danger" iconType="trash" onClick={onClick}>
        {i18n.translate('workspace.detail.collaborator.delete', {
          defaultMessage: 'Delete {num} collaborators',
          values: {
            num: selection.length,
          },
        })}
      </EuiButton>
    );
  };

  const renderToolsRight = () => {
    if (selection.length === 0) {
      return;
    }
    return (
      <Actions
        permissionSettings={permissionSettings}
        isTableAction={false}
        onChange={onChange}
        selection={selection}
        handleSubmitPermissionSettings={handleSubmitPermissionSettings}
      />
    );
  };

  const search: EuiSearchBarProps = {
    box: {
      incremental: true,
    },
    filters: [
      {
        type: 'field_value_selection',
        field: 'displayedType',
        name: 'Type',
        multiSelect: false,
        options: Array.from(new Set(items.map(({ displayedType }) => displayedType ?? ''))).map(
          (item) => ({
            value: item,
            name: item,
          })
        ),
      },
      {
        type: 'field_value_selection',
        field: 'accessLevel',
        name: 'Access level',
        multiSelect: false,
        options: Array.from(new Set(items.map(({ accessLevel }) => accessLevel ?? ''))).map(
          (item) => ({
            value: item,
            name: item,
          })
        ),
      },
    ],
    toolsLeft: renderToolsLeft(),
    toolsRight: renderToolsRight(),
  };

  const columns: Array<EuiBasicTableColumn<PermissionSetting>> = [
    {
      field: 'primaryId',
      name: 'ID',
    },
    {
      field: 'displayedType',
      name: 'Type',
    },
    {
      field: 'accessLevel',
      name: 'Access level',
    },
    {
      name: 'Actions',
      field: '',
      render: (item: PermissionSetting) => (
        <Actions
          isTableAction={true}
          selection={[item]}
          onChange={onChange}
          permissionSettings={permissionSettings}
          handleSubmitPermissionSettings={handleSubmitPermissionSettings}
        />
      ),
    },
  ];
  const selectionValue: EuiTableSelectionType<PermissionSetting> = {
    onSelectionChange: (newSelection) => setSelection(newSelection),
  };

  return (
    <EuiInMemoryTable
      items={items}
      columns={columns}
      search={search}
      itemId="id"
      pagination={true}
      message={emptyStateMessage}
      isSelectable={true}
      selection={selectionValue}
    />
  );
};

const Actions = ({
  isTableAction,
  selection,
  onChange,
  permissionSettings,
  handleSubmitPermissionSettings,
}: {
  isTableAction: boolean;
  selection?: PermissionSetting[];
  onChange?: (newSettings: PermissionSetting[]) => void;
  permissionSettings: PermissionSetting[];
  handleSubmitPermissionSettings: (permissionSettings: WorkspacePermissionSetting[]) => void;
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { overlays } = useOpenSearchDashboards();

  const accessLevelOptions = Object.keys(WORKSPACE_ACCESS_LEVEL_NAMES).map((level) => ({
    name: WORKSPACE_ACCESS_LEVEL_NAMES[level as WorkspaceCollaboratorAccessLevel],
    onClick: async () => {
      setIsPopoverOpen(false);
      if (selection) {
        const modal = overlays.openModal(
          <EuiConfirmModal
            title="Change access level"
            onCancel={() => modal.close()}
            onConfirm={async () => {
              let newSettings = permissionSettings;
              selection.forEach(({ id }) => {
                newSettings = newSettings.map((item) =>
                  id === item.id
                    ? {
                        ...item,
                        modes:
                          accessLevelNameToWorkspacePermissionModesMap[
                            level as WorkspaceCollaboratorAccessLevel
                          ],
                      }
                    : item
                );
              });
              onChange?.(newSettings);
              handleSubmitPermissionSettings(newSettings as WorkspacePermissionSetting[]);
              modal.close();
            }}
            cancelButtonText="Cancel"
            confirmButtonText="Confirm"
          >
            <EuiText>
              <p>
                Do you want to change access level to {selection.length} collaborator
                {`${selection.length > 1 ? 's' : ''}`} to{' '}
                {`"${WORKSPACE_ACCESS_LEVEL_NAMES[level as WorkspaceCollaboratorAccessLevel]}"`}?
              </p>
            </EuiText>
          </EuiConfirmModal>
        );
      }
    },
    icon: '',
  }));

  const panelItems = ([
    {
      id: 0,
      items: [
        {
          name: i18n.translate('workspace.detail.collaborator.actions.change.access', {
            defaultMessage: 'Change access level',
          }),
          panel: 1,
        },
        isTableAction && {
          name: i18n.translate('workspace.detail.collaborator.actions.delete', {
            defaultMessage: 'Delete collaborator',
          }),
          onClick: () => {
            setIsPopoverOpen(false);
            if (selection) {
              const modal = overlays.openModal(
                <EuiConfirmModal
                  title={i18n.translate('workspace.detail.collaborator.actions.delete', {
                    defaultMessage: 'Delete collaborator',
                  })}
                  onCancel={() => modal.close()}
                  onConfirm={async () => {
                    let newSettings = permissionSettings;
                    selection.forEach(({ id }) => {
                      newSettings = newSettings.filter((_item) => _item.id !== id);
                    });
                    onChange?.(newSettings);
                    handleSubmitPermissionSettings(newSettings as WorkspacePermissionSetting[]);
                    modal.close();
                  }}
                  cancelButtonText="Cancel"
                  confirmButtonText="Confirm"
                >
                  <EuiText>
                    <p>
                      Delete collaborator? The collaborators will not have access to the workspace.
                    </p>
                  </EuiText>
                </EuiConfirmModal>
              );
            }
          },
        },
      ].filter(Boolean),
    },
    {
      id: 1,
      title: i18n.translate('workspace.detail.collaborator.actions.change.access', {
        defaultMessage: 'Change access level',
      }),
      items: accessLevelOptions,
    },
  ] as unknown) as EuiContextMenuPanelDescriptor[];

  const button = isTableAction ? (
    <EuiButtonIcon
      iconType="boxesHorizontal"
      onClick={() => setIsPopoverOpen(true)}
      data-test-subj="workspace-detail-collaborator-table-actions-box"
    />
  ) : (
    <EuiButton
      iconType="arrowDown"
      iconSide="right"
      onClick={() => setIsPopoverOpen(true)}
      data-test-subj="workspace-detail-collaborator-table-actions"
    >
      {i18n.translate('workspace.detail.collaborator.actions.', {
        defaultMessage: 'Actions',
      })}
    </EuiButton>
  );
  return (
    <EuiPopover
      id="workspace-detail-add-collaborator-action"
      button={button}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      panelPaddingSize="none"
      anchorPosition="downLeft"
      ownFocus={false}
    >
      <EuiContextMenu initialPanelId={0} size="m" panels={panelItems} />
    </EuiPopover>
  );
};
