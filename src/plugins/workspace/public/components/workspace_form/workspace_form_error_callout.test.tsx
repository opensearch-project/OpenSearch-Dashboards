/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import {
  WorkspaceFormErrorCallout,
  WorkspaceFormErrorCalloutProps,
} from './workspace_form_error_callout';
import { WorkspaceFormErrorCode } from './types';

const setup = (options?: Partial<WorkspaceFormErrorCalloutProps>) => {
  const renderResult = render(<WorkspaceFormErrorCallout errors={{ ...options?.errors }} />);
  return {
    renderResult,
  };
};

describe('WorkspaceFormErrorCallout', () => {
  it('should render error callout title', () => {
    const { renderResult } = setup({});

    expect(
      renderResult.getByText('Address the following error(s) in the form')
    ).toBeInTheDocument();
  });

  it('should render workspace name suggestion', () => {
    const { renderResult } = setup({
      errors: {
        name: {
          code: WorkspaceFormErrorCode.WorkspaceNameMissing,
          message: '',
        },
      },
    });

    expect(renderResult.getByText('Name: Enter a workspace name.')).toBeInTheDocument();

    renderResult.rerender(
      <WorkspaceFormErrorCallout
        errors={{ name: { code: WorkspaceFormErrorCode.InvalidWorkspaceName, message: '' } }}
      />
    );

    expect(renderResult.getByText('Name: Enter a valid workspace name.')).toBeInTheDocument();
  });

  it('should render use case suggestion', () => {
    const { renderResult } = setup({
      errors: {
        name: {
          code: WorkspaceFormErrorCode.WorkspaceNameMissing,
          message: '',
        },
      },
    });

    expect(renderResult.getByText('Name: Enter a workspace name.')).toBeInTheDocument();
  });

  it('should combine user permission settings suggestions', () => {
    const { renderResult } = setup({
      errors: {
        permissionSettings: {
          0: {
            code: WorkspaceFormErrorCode.PermissionUserIdMissing,
            message: '',
          },
          1: {
            code: WorkspaceFormErrorCode.PermissionUserIdMissing,
            message: '',
          },
          2: {
            code: WorkspaceFormErrorCode.DuplicateUserIdPermissionSetting,
            message: '',
          },
          3: {
            code: WorkspaceFormErrorCode.DuplicateUserIdPermissionSetting,
            message: '',
          },
        },
      },
    });

    expect(renderResult.getByText('User: Enter a user.')).toBeInTheDocument();
    expect(renderResult.getAllByText('User: Enter a user.')).toHaveLength(1);

    expect(renderResult.getByText('User: Enter a unique user.')).toBeInTheDocument();
    expect(renderResult.getAllByText('User: Enter a unique user.')).toHaveLength(1);
  });

  it('should combine user group permission settings suggestions', () => {
    const { renderResult } = setup({
      errors: {
        permissionSettings: {
          0: {
            code: WorkspaceFormErrorCode.PermissionUserGroupMissing,
            message: '',
          },
          1: {
            code: WorkspaceFormErrorCode.PermissionUserGroupMissing,
            message: '',
          },
          2: {
            code: WorkspaceFormErrorCode.DuplicateUserGroupPermissionSetting,
            message: '',
          },
          3: {
            code: WorkspaceFormErrorCode.DuplicateUserGroupPermissionSetting,
            message: '',
          },
        },
      },
    });

    expect(renderResult.getByText('User Group: Enter a user group.')).toBeInTheDocument();
    expect(renderResult.getAllByText('User Group: Enter a user group.')).toHaveLength(1);

    expect(renderResult.getByText('User Group: Enter a unique user group.')).toBeInTheDocument();
    expect(renderResult.getAllByText('User Group: Enter a unique user group.')).toHaveLength(1);
  });
});
