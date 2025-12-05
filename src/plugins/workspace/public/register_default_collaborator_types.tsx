/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { CoreSetup, OverlayRef } from '../../../core/public';
import { toMountPoint } from '../../../plugins/opensearch_dashboards_react/public';

import { WorkspaceCollaboratorTypesService, WorkspaceCollaboratorType } from './services';
import {
  AddCollaboratorsModal,
  AddCollaboratorsModalProps,
} from './components/add_collaborators_modal';

export const generateOnAddCallback: (
  options: Omit<AddCollaboratorsModalProps, 'onClose' | 'onAddCollaborators'> & {
    getStartServices: CoreSetup['getStartServices'];
  }
) => WorkspaceCollaboratorType['onAdd'] = ({ getStartServices, ...props }) => async ({
  onAddCollaborators,
}) => {
  let overlayRef: OverlayRef | null = null;
  const [coreStart] = await getStartServices();
  overlayRef = coreStart.overlays.openModal(
    toMountPoint(
      <AddCollaboratorsModal
        {...props}
        onClose={() => {
          overlayRef?.close();
        }}
        onAddCollaborators={async (collaborators) => {
          await onAddCollaborators(collaborators);
          overlayRef?.close();
        }}
      />
    )
  );
};

export const registerDefaultCollaboratorTypes = ({
  getStartServices,
  collaboratorTypesService,
}: {
  collaboratorTypesService: WorkspaceCollaboratorTypesService;
  getStartServices: CoreSetup['getStartServices'];
}) => {
  collaboratorTypesService.setTypes([
    {
      id: 'user',
      name: i18n.translate('workspace.collaboratorType.defaultUser.name', {
        defaultMessage: 'User',
      }),
      buttonLabel: i18n.translate('workspace.collaboratorType.defaultUser.buttonLabel', {
        defaultMessage: 'Add Users',
      }),
      getDisplayedType: ({ permissionType }) =>
        permissionType === 'user'
          ? i18n.translate('workspace.collaboratorType.defaultUser.displayedType', {
              defaultMessage: 'User',
            })
          : undefined,
      onAdd: generateOnAddCallback({
        getStartServices,
        title: i18n.translate('workspace.collaboratorType.defaultUser.modalTitle', {
          defaultMessage: 'Add Users',
        }),
        inputLabel: i18n.translate('workspace.collaboratorType.defaultUser.inputLabel', {
          defaultMessage: 'User ID',
        }),
        inputPlaceholder: i18n.translate(
          'workspace.collaboratorType.defaultUser.inputPlaceholder',
          {
            defaultMessage: 'Enter User ID',
          }
        ),
        addAnotherButtonLabel: i18n.translate(
          'workspace.collaboratorType.defaultUser.addAnotherButtonLabel',
          {
            defaultMessage: 'Add another User',
          }
        ),
        permissionType: 'user',
      }),
    },
    {
      id: 'group',
      name: i18n.translate('workspace.collaboratorType.defaultGroup.name', {
        defaultMessage: 'Group',
      }),
      buttonLabel: i18n.translate('workspace.collaboratorType.defaultGroup.buttonLabel', {
        defaultMessage: 'Add Groups',
      }),
      getDisplayedType: ({ permissionType }) =>
        permissionType === 'group'
          ? i18n.translate('workspace.collaboratorType.defaultGroup.displayedType', {
              defaultMessage: 'Group',
            })
          : undefined,
      onAdd: generateOnAddCallback({
        getStartServices,
        title: i18n.translate('workspace.collaboratorType.defaultGroup.modalTitle', {
          defaultMessage: 'Add Groups',
        }),
        inputLabel: i18n.translate('workspace.collaboratorType.defaultGroup.inputLabel', {
          defaultMessage: 'Group ID',
        }),
        inputPlaceholder: i18n.translate(
          'workspace.collaboratorType.defaultGroup.inputPlaceholder',
          {
            defaultMessage: 'Enter Group ID',
          }
        ),
        addAnotherButtonLabel: i18n.translate(
          'workspace.collaboratorType.defaultGroup.addAnotherButtonLabel',
          {
            defaultMessage: 'Add another Group',
          }
        ),
        permissionType: 'group',
      }),
    },
  ]);
};
