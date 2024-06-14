/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiCallOut } from '@elastic/eui';
import { WorkspaceFormErrors } from './types';
import { getNumberOfErrors } from './utils';

interface WorkspaceFormErrorCalloutProps {
  errors: WorkspaceFormErrors;
}

export const WorkspaceFormErrorCallout = ({ errors }: WorkspaceFormErrorCalloutProps) => {
  if (getNumberOfErrors(errors) === 0) {
    return null;
  }
  return (
    <EuiCallOut title="Address the following error(s) in the form" color="danger" iconType="alert">
      {errors.name && (
        <p>
          {i18n.translate('workspace.form.errorCallout.nameKey', {
            defaultMessage: 'Name:',
          })}
          &nbsp;
          {errors.name}
        </p>
      )}
      {errors.features && (
        <p>
          {i18n.translate('workspace.form.errorCallout.nameKey', {
            defaultMessage: 'Use case:',
          })}
          &nbsp;
          {errors.features}
        </p>
      )}
      {errors.permissionSettings && (
        <p>
          {i18n.translate('workspace.form.errorCallout.nameKey', {
            defaultMessage: 'Permissions:',
          })}
          <br />
          {Object.keys(errors.permissionSettings).map((key) => (
            <p>
              {key}
              {errors.permissionSettings[key]}
            </p>
          ))}
        </p>
      )}
    </EuiCallOut>
  );
};
