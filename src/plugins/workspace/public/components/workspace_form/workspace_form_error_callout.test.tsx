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

    expect(renderResult.getByText('Name: Enter a name.')).toBeInTheDocument();

    renderResult.rerender(
      <WorkspaceFormErrorCallout
        errors={{ name: { code: WorkspaceFormErrorCode.InvalidWorkspaceName, message: '' } }}
      />
    );

    expect(renderResult.getByText('Name: Enter a valid name.')).toBeInTheDocument();
  });

  it('should render color suggestion', () => {
    const { renderResult } = setup({
      errors: {
        color: {
          code: WorkspaceFormErrorCode.InvalidColor,
          message: '',
        },
      },
    });

    expect(renderResult.getByText('Color: Choose a valid color.')).toBeInTheDocument();
  });

  it('should render use case suggestion', () => {
    const { renderResult } = setup({
      errors: {
        features: {
          code: WorkspaceFormErrorCode.UseCaseMissing,
          message: '',
        },
      },
    });

    expect(renderResult.getByText('Use case: Select a use case.')).toBeInTheDocument();
  });

  it('should render original message if code not recognized', () => {
    const { renderResult } = setup({
      errors: {
        name: {
          code: 'unknown' as any,
          message: 'Original name error message.',
        },
      },
    });

    expect(renderResult.getByText('Name: Original name error message.')).toBeInTheDocument();
  });
});
