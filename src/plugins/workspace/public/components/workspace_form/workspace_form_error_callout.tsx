/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiCallOut, EuiText } from '@elastic/eui';
import { WorkspaceFormErrors, WorkspaceFormError, WorkspaceFormErrorCode } from './types';

const getSuggestionFromErrorCode = (error: WorkspaceFormError) => {
  switch (error.code) {
    case WorkspaceFormErrorCode.WorkspaceNameMissing:
      return i18n.translate('workspace.form.errorCallout.nameMissing', {
        defaultMessage: 'Enter a name.',
      });
    case WorkspaceFormErrorCode.InvalidWorkspaceName:
      return i18n.translate('workspace.form.errorCallout.nameInvalid', {
        defaultMessage: 'Enter a valid name.',
      });
    case WorkspaceFormErrorCode.UseCaseMissing:
      return i18n.translate('workspace.form.errorCallout.useCaseMissing', {
        defaultMessage: 'Select a use case.',
      });
    case WorkspaceFormErrorCode.PermissionUserIdMissing:
      return i18n.translate('workspace.form.errorCallout.missingUser', {
        defaultMessage: 'Enter a user.',
      });
    case WorkspaceFormErrorCode.PermissionUserGroupMissing:
      return i18n.translate('workspace.form.errorCallout.missingUserGroup', {
        defaultMessage: 'Enter a user group.',
      });
    case WorkspaceFormErrorCode.DuplicateUserIdPermissionSetting:
      return i18n.translate('workspace.form.errorCallout.duplicatePermission', {
        defaultMessage: 'Enter a unique user.',
      });
    case WorkspaceFormErrorCode.DuplicateUserGroupPermissionSetting:
      return i18n.translate('workspace.form.errorCallout.duplicatePermission', {
        defaultMessage: 'Enter a unique user group.',
      });
    case WorkspaceFormErrorCode.PermissionSettingOwnerMissing:
      return i18n.translate('workspace.form.errorCallout.permissionSettingOwnerMissing', {
        defaultMessage: 'Add a workspace owner.',
      });
    case WorkspaceFormErrorCode.InvalidColor:
      return i18n.translate('workspace.form.errorCallout.invalidColor', {
        defaultMessage: 'Enter a valid color.',
      });
    default:
      return error.message;
  }
};

const WorkspaceFormErrorCalloutItem = ({
  errorKey,
  message,
}: {
  errorKey: string;
  message: string;
}) => {
  return (
    <li>
      {errorKey}&nbsp;{message}
    </li>
  );
};

export interface WorkspaceFormErrorCalloutProps {
  errors: WorkspaceFormErrors;
}

export const WorkspaceFormErrorCallout = ({ errors }: WorkspaceFormErrorCalloutProps) => {
  const renderPermissionSettingSuggestion = (errorCode: WorkspaceFormErrorCode) => {
    if (!errors.permissionSettings?.fields) {
      return null;
    }
    const findingError = Object.values(errors.permissionSettings.fields).find(
      (item) => item.code === errorCode
    );

    if (!findingError) {
      return null;
    }

    return (
      <WorkspaceFormErrorCalloutItem
        errorKey={
          errorCode === WorkspaceFormErrorCode.DuplicateUserIdPermissionSetting ||
          errorCode === WorkspaceFormErrorCode.PermissionUserIdMissing
            ? i18n.translate('workspace.form.errorCallout.userPermissionKey', {
                defaultMessage: 'User:',
              })
            : i18n.translate('workspace.form.errorCallout.userGroupPermissionKey', {
                defaultMessage: 'User Group:',
              })
        }
        message={getSuggestionFromErrorCode(findingError)}
      />
    );
  };
  return (
    <EuiCallOut title="Address the following error(s) in the form" color="danger" iconType="alert">
      <EuiText size="s">
        <ul style={{ listStyle: 'inside', margin: 0, marginLeft: 6 }}>
          {errors.name && (
            <WorkspaceFormErrorCalloutItem
              errorKey={i18n.translate('workspace.form.errorCallout.nameKey', {
                defaultMessage: 'Name:',
              })}
              message={getSuggestionFromErrorCode(errors.name)}
            />
          )}
          {errors.color && (
            <WorkspaceFormErrorCalloutItem
              errorKey={i18n.translate('workspace.form.errorCallout.nameKey', {
                defaultMessage: 'Color:',
              })}
              message={getSuggestionFromErrorCode(errors.color)}
            />
          )}
          {errors.features && (
            <WorkspaceFormErrorCalloutItem
              errorKey={i18n.translate('workspace.form.errorCallout.useCaseKey', {
                defaultMessage: 'Use case:',
              })}
              message={getSuggestionFromErrorCode(errors.features)}
            />
          )}
          {renderPermissionSettingSuggestion(WorkspaceFormErrorCode.PermissionUserIdMissing)}
          {renderPermissionSettingSuggestion(
            WorkspaceFormErrorCode.DuplicateUserIdPermissionSetting
          )}
          {renderPermissionSettingSuggestion(WorkspaceFormErrorCode.PermissionUserGroupMissing)}
          {renderPermissionSettingSuggestion(
            WorkspaceFormErrorCode.DuplicateUserGroupPermissionSetting
          )}
          {errors.permissionSettings?.overall && (
            <WorkspaceFormErrorCalloutItem
              errorKey={i18n.translate('workspace.form.errorCallout.accessAndPermissionsKey', {
                defaultMessage: 'Manage access and permissions:',
              })}
              message={getSuggestionFromErrorCode(errors.permissionSettings.overall)}
            />
          )}
        </ul>
      </EuiText>
    </EuiCallOut>
  );
};
