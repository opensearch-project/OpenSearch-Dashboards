/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { i18n } from '@osd/i18n';

// Use string literal avoid import enum from workspace self
type WorkspaceCollaboratorPermissionSettingType = 'user' | 'group';

export interface WorkspaceCollaboratorType {
  id: string;
  name: string;
  pluralName: string;
  // Will be assigned to this type in the final ACL permissions object
  permissionSettingType: WorkspaceCollaboratorPermissionSettingType;
  modal: {
    title: string;
    description?: string;
    // Will use name with ID suffix for fallback
    inputLabel?: string;
    inputDescription?: string;
    // Will use name with ID suffix for fallback
    inputPlaceholder?: string;
  };
  instruction?: {
    title: string;
    detail: string;
    link?: string;
  };
  // To match wether passed collaborator match this collaborator type
  collaboratorMatcher?: (collaborator: {
    type: WorkspaceCollaboratorPermissionSettingType;
    userOrGroupId: string;
  }) => boolean;
}

export const defaultWorkspaceCollaboratorTypes: WorkspaceCollaboratorType[] = [
  {
    id: 'user',
    name: i18n.translate('workspace.collaboratorType.defaultUser.name', { defaultMessage: 'User' }),
    pluralName: i18n.translate('workspace.collaboratorType.defaultUser.pluralName', {
      defaultMessage: 'Users',
    }),
    permissionSettingType: 'user',
    modal: {
      title: i18n.translate('workspace.collaboratorType.defaultUser.modal.title', {
        defaultMessage: 'Add Users',
      }),
    },
    collaboratorMatcher: (collaborator) => collaborator.type === 'user',
  },
  {
    id: 'group',
    name: i18n.translate('workspace.collaboratorType.defaultGroup.name', {
      defaultMessage: 'Group',
    }),
    pluralName: i18n.translate('workspace.collaboratorType.defaultGroup.pluralName', {
      defaultMessage: 'Groups',
    }),
    permissionSettingType: 'group',
    modal: {
      title: i18n.translate('workspace.collaboratorType.defaultGroup.modal.title', {
        defaultMessage: 'Add Groups',
      }),
    },
    collaboratorMatcher: (collaborator) => collaborator.type === 'group',
  },
];

export class WorkspaceCollaboratorTypesService {
  private _collaboratorTypes$ = new BehaviorSubject<WorkspaceCollaboratorType[]>(
    defaultWorkspaceCollaboratorTypes
  );

  public getTypes$() {
    return this._collaboratorTypes$;
  }

  public setTypes(types: WorkspaceCollaboratorType[]) {
    this._collaboratorTypes$.next(types);
  }

  public stop() {
    this._collaboratorTypes$.complete();
  }
}
