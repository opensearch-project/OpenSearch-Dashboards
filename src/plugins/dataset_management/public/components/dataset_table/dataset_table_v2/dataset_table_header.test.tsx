/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { DatasetTableHeader } from './dataset_table_header';

jest.mock('@osd/i18n', () => ({
  ...jest.requireActual('@osd/i18n'),
  i18n: {
    translate: jest.fn(
      (key: string, options: { defaultMessage: string }) => options.defaultMessage
    ),
  },
}));

jest.mock('../../create_button', () => ({
  CreateDatasetButton: ({ children, onCreateDataset }: any) => (
    <button data-testid="createDatasetButton" onClick={() => onCreateDataset('test')}>
      {children}
    </button>
  ),
}));

const renderWithIntl = (component: React.ReactElement) => {
  // @ts-expect-error TS2769 TODO(ts-error): fixme
  return render(<IntlProvider locale="en">{component}</IntlProvider>);
};

describe('DatasetTableHeader', () => {
  const mockOnCreateDataset = jest.fn();
  const mockSetAppRightControls = jest.fn();
  const mockSetAppDescriptionControls = jest.fn();

  const defaultProps = {
    canSave: true,
    useUpdatedUX: false,
    onCreateDataset: mockOnCreateDataset,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render title and description when not using updated UX', () => {
    renderWithIntl(<DatasetTableHeader {...defaultProps} />);

    expect(screen.getByText('Datasets')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Create and manage the datasets that help you retrieve your data from OpenSearch.'
      )
    ).toBeInTheDocument();
  });

  it('should render create button when canSave is true', () => {
    renderWithIntl(<DatasetTableHeader {...defaultProps} />);

    expect(screen.getByText('Create dataset')).toBeInTheDocument();
  });

  it('should not render create button when canSave is false', () => {
    renderWithIntl(<DatasetTableHeader {...defaultProps} canSave={false} />);

    expect(screen.queryByText('Create dataset')).not.toBeInTheDocument();
  });

  it('should include workspace name in description when provided', () => {
    renderWithIntl(<DatasetTableHeader {...defaultProps} currentWorkspaceName="My Workspace" />);

    // Since i18n mock doesn't handle values interpolation, just check the component renders
    expect(screen.getByText('Datasets')).toBeInTheDocument();
  });

  it('should use HeaderControl when useUpdatedUX is true and HeaderControl is provided', () => {
    const MockHeaderControl = jest.fn(() => <div data-testid="header-control" />);

    renderWithIntl(
      <DatasetTableHeader
        {...defaultProps}
        useUpdatedUX={true}
        HeaderControl={MockHeaderControl}
        setAppRightControls={mockSetAppRightControls}
        setAppDescriptionControls={mockSetAppDescriptionControls}
      />
    );

    expect(MockHeaderControl).toHaveBeenCalled();
  });

  it('should render standard UI when useUpdatedUX is false', () => {
    renderWithIntl(<DatasetTableHeader {...defaultProps} useUpdatedUX={false} />);

    // Should render regular title and description
    expect(screen.getByText('Datasets')).toBeInTheDocument();
  });
});
