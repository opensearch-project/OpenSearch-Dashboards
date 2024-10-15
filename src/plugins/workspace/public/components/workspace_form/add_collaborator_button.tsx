/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  EuiPopover,
  EuiContextMenu,
  EuiSmallButton,
  EuiContextMenuPanelDescriptor,
  EuiIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspaceCollaboratorType } from '../../services/workspace_collaborator_types_service';
import { WorkspaceCollaborator } from '../../types';
import { PermissionSetting } from './workspace_collaborator_table';
import { generateNextPermissionSettingsId, hasSameUserIdOrGroup } from './utils';
import { accessLevelNameToWorkspacePermissionModesMap } from '../../constants';
import { WorkspacePermissionItemType } from './constants';
import { WorkspacePermissionSetting } from './types';
import { DuplicateCollaboratorError } from '../add_collaborators_modal';

interface Props {
  displayedTypes: WorkspaceCollaboratorType[];
  permissionSettings: PermissionSetting[];
  handleSubmitPermissionSettings: (
    permissionSettings: WorkspacePermissionSetting[]
  ) => Promise<void>;
}

export const AddCollaboratorButton = ({
  displayedTypes,
  permissionSettings,
  handleSubmitPermissionSettings,
}: Props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const nextIdRef = useRef(generateNextPermissionSettingsId(permissionSettings));

  const nextIdGenerator = useCallback(() => {
    const nextId = nextIdRef.current;
    nextIdRef.current++;
    return nextId;
  }, []);

  const onAddCollaborators = async (collaborators: WorkspaceCollaborator[]) => {
    const uniqueCollaboratorIds = new Set();
    const addedSettings = collaborators.map(({ permissionType, accessLevel, collaboratorId }) => ({
      type: permissionType,
      modes: accessLevelNameToWorkspacePermissionModesMap[accessLevel],
      id: nextIdGenerator(),
      ...(permissionType === WorkspacePermissionItemType.User
        ? {
            userId: collaboratorId,
          }
        : {
            group: collaboratorId,
          }),
      collaboratorId,
    })) as Array<WorkspacePermissionSetting & { collaboratorId: string }>;
    const existingDuplicateSettings = addedSettings.filter((permissionSettingToAdd) =>
      hasSameUserIdOrGroup(permissionSettings, permissionSettingToAdd)
    );
    const pendingAddedDuplicateCollaboratorIds = Array.from(
      new Set(
        collaborators.flatMap(({ collaboratorId }) => {
          if (uniqueCollaboratorIds.has(collaboratorId)) {
            return [collaboratorId];
          }
          uniqueCollaboratorIds.add(collaboratorId);
          return [];
        })
      )
    );
    if (pendingAddedDuplicateCollaboratorIds.length > 0 || existingDuplicateSettings.length > 0) {
      throw new DuplicateCollaboratorError({
        pendingAdded: pendingAddedDuplicateCollaboratorIds,
        existing: Array.from(
          new Set(existingDuplicateSettings.map((setting) => setting.collaboratorId))
        ),
      });
    }
    const newPermissionSettings = [
      ...permissionSettings,
      ...addedSettings.map(({ collaboratorId, ...rest }) => rest),
    ];
    await handleSubmitPermissionSettings(newPermissionSettings as WorkspacePermissionSetting[]);
  };

  const panelItems = displayedTypes.map(({ id, buttonLabel, onAdd }) => ({
    id,
    name: buttonLabel,
    onClick: () => {
      onAdd({ onAddCollaborators });
      setIsPopoverOpen(false);
    },
  }));

  return (
    <EuiPopover
      id="add-collaborator-popover"
      data-test-subj="add-collaborator-popover"
      button={
        <EuiSmallButton
          iconSide="left"
          iconType="plusInCircle"
          fill
          onClick={() => setIsPopoverOpen((prev) => !prev)}
          data-test-subj="add-collaborator-button"
        >
          {i18n.translate('workspace.workspaceDetail.collaborator.add', {
            defaultMessage: 'Add collaborators',
          })}
          &nbsp;&nbsp;
          <EuiIcon type="arrowDown" />
        </EuiSmallButton>
      }
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      panelPaddingSize="none"
      anchorPosition="downLeft"
      initialFocus={false}
    >
      <EuiContextMenu
        size="s"
        panels={
          ([
            {
              items: panelItems,
            },
          ] as unknown) as EuiContextMenuPanelDescriptor[]
        }
      />
    </EuiPopover>
  );
};
