/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { WorkspacePermissionMode } from '../../../common/constants';
import { PermissionModeId } from '../../../../../core/public';

export enum WorkspaceOperationType {
  Create = 'create',
  Update = 'update',
}

export enum WorkspacePermissionItemType {
  User = 'user',
  Group = 'group',
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
  defaultMessage: 'Workspaces access',
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

export enum DetailTab {
  Details = 'details',
  DataSources = 'dataSources',
  Collaborators = 'collaborators',
}

export const DetailTabTitles: { [key in DetailTab]: string } = {
  [DetailTab.Details]: i18n.translate('workspace.detail.tabTitle.details', {
    defaultMessage: 'Details',
  }),
  [DetailTab.DataSources]: i18n.translate('workspace.detail.tabTitle.dataSources', {
    defaultMessage: 'Data sources',
  }),
  [DetailTab.Collaborators]: i18n.translate('workspace.detail.tabTitle.collaborators', {
    defaultMessage: 'Collaborators',
  }),
};

export const PERMISSION_TYPE_LABEL_ID = 'workspace-form-permission-type-label';
export const PERMISSION_COLLABORATOR_LABEL_ID = 'workspace-form-permission-collaborator-label';
export const PERMISSION_ACCESS_LEVEL_LABEL_ID = 'workspace-form-permission-access-level-label';
