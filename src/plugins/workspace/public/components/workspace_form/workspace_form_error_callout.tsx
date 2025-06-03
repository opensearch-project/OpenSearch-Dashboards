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
    case WorkspaceFormErrorCode.InvalidColor:
      return i18n.translate('workspace.form.errorCallout.invalidColor', {
        defaultMessage: 'Choose a valid color.',
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
              errorKey={i18n.translate('workspace.form.errorCallout.colorKey', {
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
        </ul>
      </EuiText>
    </EuiCallOut>
  );
};
