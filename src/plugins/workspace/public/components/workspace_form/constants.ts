/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { PermissionModeId, WorkspacePermissionMode } from '../../../../../core/public';
import { WORKSPACE_ACCESS_LEVEL_NAMES } from '../../constants';

export enum WorkspaceOperationType {
  Create = 'create',
  Update = 'update',
}

export enum WorkspacePermissionItemType {
  User = 'user',
  Group = 'group',
}

export enum WorkspacePrivacyItemType {
  PrivateToCollaborators = 'private-to-collaborators',
  AnyoneCanView = 'anyone-can-view',
  AnyoneCanEdit = 'anyone-can-edit',
}

export const optionIdToWorkspacePermissionModesMap: {
  [key: string]: WorkspacePermissionMode[];
} = {
  [PermissionModeId.Read]: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
  [PermissionModeId.ReadAndWrite]: [
    WorkspacePermissionMode.LibraryWrite,
    WorkspacePermissionMode.Read,
  ],
  [PermissionModeId.Owner]: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
};

export const workspaceDetailsTitle = i18n.translate('workspace.form.workspaceDetails.title', {
  defaultMessage: 'Enter details',
});

export const workspaceUseCaseTitle = i18n.translate('workspace.form.workspaceUseCase.title', {
  defaultMessage: 'Choose one or more focus areas',
});

export const selectDataSourceTitle = i18n.translate('workspace.form.selectDataSource.title', {
  defaultMessage: 'Associate data source',
});

export const usersAndPermissionsTitle = i18n.translate('workspace.form.usersAndPermissions.title', {
  defaultMessage: 'Workspace access',
});

export const usersAndPermissionsCreatePageTitle = i18n.translate(
  'workspace.form.usersAndPermissions.createPage.title',
  { defaultMessage: 'Add collaborators' }
);

export const detailsName = i18n.translate('workspace.form.workspaceDetails.name.label', {
  defaultMessage: 'Name',
});

export const detailsNameHelpText = i18n.translate('workspace.form.workspaceDetails.name.helpText', {
  defaultMessage:
    'Valid characters are a-z, A-Z, 0-9, (), [], _ (underscore), - (hyphen) and (space).',
});

export const detailsNamePlaceholder = i18n.translate(
  'workspace.form.workspaceDetails.name.placeholder',
  {
    defaultMessage: 'Enter a name',
  }
);

export const detailsDescriptionIntroduction = i18n.translate(
  'workspace.form.workspaceDetails.description.introduction',
  {
    defaultMessage: 'Describe the workspace.',
  }
);

export const detailsDescriptionPlaceholder = i18n.translate(
  'workspace.form.workspaceDetails.description.placeholder',
  {
    defaultMessage: 'Describe the workspace',
  }
);

export const detailsUseCaseLabel = i18n.translate('workspace.form.workspaceDetails.useCase.label', {
  defaultMessage: 'Use case',
});

export const detailsUseCaseHelpText = i18n.translate(
  'workspace.form.workspaceDetails.useCase.helpText',
  {
    defaultMessage: 'You can only choose use cases with more features than the current use case.',
  }
);

export const detailsColorLabel = i18n.translate('workspace.form.workspaceDetails.color.label', {
  defaultMessage: 'Workspace icon color',
});

export const detailsColorHelpText = i18n.translate(
  'workspace.form.workspaceDetails.color.helpText',
  {
    defaultMessage: 'The background color of the icon that represents the workspace.',
  }
);

export const workspacePrivacyTitle = i18n.translate(
  'workspace.form.collaborators.panels.privacy.title',
  {
    defaultMessage: 'Workspace privacy',
  }
);

export const privacyType2TextMap = {
  [WorkspacePrivacyItemType.PrivateToCollaborators]: {
    title: i18n.translate('workspace.privacy.privateToCollaborators.title', {
      defaultMessage: 'Private to collaborators',
    }),
    description: i18n.translate('workspace.privacy.privateToCollaborators.description', {
      defaultMessage: 'Only collaborators can access the workspace.',
    }),
    additionalDescription: i18n.translate(
      'workspace.privacy.privateToCollaborators.additionalDescription',
      {
        defaultMessage:
          'You can add collaborators who can view or edit workspace and assign workspace administrators once the workspace is created.',
      }
    ),
  },
  [WorkspacePrivacyItemType.AnyoneCanView]: {
    title: i18n.translate('workspace.privacy.anyoneCanView.title', {
      defaultMessage: 'Anyone can view',
    }),
    description: i18n.translate('workspace.privacy.anyoneCanView.description', {
      defaultMessage: 'Anyone can view workspace assets.',
    }),
    additionalDescription: i18n.translate('workspace.privacy.anyoneCanView.additionalDescription', {
      defaultMessage:
        'You can add collaborators who can edit workspace and assign workspace administrators once the workspace is created.',
    }),
  },
  [WorkspacePrivacyItemType.AnyoneCanEdit]: {
    title: i18n.translate('workspace.privacy.anyoneCanEdit.title', {
      defaultMessage: 'Anyone can edit',
    }),
    description: i18n.translate('workspace.privacy.anyoneCanEdit.description', {
      defaultMessage: 'Anyone can view and edit workspace assets.',
    }),
    additionalDescription: i18n.translate('workspace.privacy.anyoneCanEdit.additionalDescription', {
      defaultMessage: 'You can assign workspace administrators once the workspace is created.',
    }),
  },
};

export const PERMISSION_TYPE_LABEL_ID = 'workspace-form-permission-type-label';
export const PERMISSION_COLLABORATOR_LABEL_ID = 'workspace-form-permission-collaborator-label';
export const PERMISSION_ACCESS_LEVEL_LABEL_ID = 'workspace-form-permission-access-level-label';

export const permissionModeOptions = [
  {
    value: PermissionModeId.Read,
    inputDisplay: WORKSPACE_ACCESS_LEVEL_NAMES.readOnly,
  },
  {
    value: PermissionModeId.ReadAndWrite,
    inputDisplay: WORKSPACE_ACCESS_LEVEL_NAMES.readAndWrite,
  },
  {
    value: PermissionModeId.Owner,
    inputDisplay: WORKSPACE_ACCESS_LEVEL_NAMES.admin,
  },
];

export const typeOptions = [
  {
    value: WorkspacePermissionItemType.User,
    inputDisplay: i18n.translate('workspace.form.permissionSettingPanel.typeOptions.user', {
      defaultMessage: 'User',
    }),
  },
  {
    value: WorkspacePermissionItemType.Group,
    inputDisplay: i18n.translate('workspace.form.permissionSettingPanel.typeOptions.group', {
      defaultMessage: 'Group',
    }),
  },
];
