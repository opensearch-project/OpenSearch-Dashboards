/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsImportError, SavedObjectsImportSuccess } from 'opensearch-dashboards/public';
import { DuplicateResultFlyout, DuplicateResultFlyoutProps } from './duplicate_result_flyout';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

describe('DuplicateResultFlyout', () => {
  const failedCopies: SavedObjectsImportError[] = [
    {
      type: 'config',
      id: '1',
      meta: { title: 'Failed Config Title' },
      error: { type: 'unknown', message: 'An error occurred', statusCode: 500 },
    },
    {
      type: 'dashboard',
      id: '2',
      meta: {},
      error: { type: 'unsupported_type' },
    },
  ];
  const successfulCopies: SavedObjectsImportSuccess[] = [
    {
      type: 'visualization',
      id: '3',
      meta: { title: 'Successful Visualization Title' },
    },
    {
      type: 'search',
      id: '4',
      meta: {},
    },
  ];
  const workspaceName = 'targetWorkspace';
  const onCloseMock = jest.fn();
  const duplicateResultFlyoutProps: DuplicateResultFlyoutProps = {
    workspaceName,
    failedCopies,
    successfulCopies,
    onClose: onCloseMock,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  const DuplicateResultFlyoutComponent = (props: DuplicateResultFlyoutProps) => {
    return (
      <IntlProvider locale="en">
        <DuplicateResultFlyout {...props} />
      </IntlProvider>
    );
  };

  it('renders the flyout with correct title and result', () => {
    render(<DuplicateResultFlyoutComponent {...duplicateResultFlyoutProps} />);
    expect(document.children).toMatchSnapshot();

    // Check title
    expect(screen.getByText('Copy saved objects to targetWorkspace')).toBeInTheDocument();

    // Check result counts
    expect(screen.getByText('4 saved objects copied')).toBeInTheDocument();
    expect(screen.getByText('2 Successful')).toBeInTheDocument();
    expect(screen.getByText('2 Error copying file')).toBeInTheDocument();

    // Check successful copy icon and message
    expect(screen.getByLabelText('visualization')).toBeInTheDocument();
    expect(screen.getByText('Successful Visualization Title')).toBeInTheDocument();

    expect(screen.getByLabelText('search')).toBeInTheDocument();
    expect(screen.getByText('search [id=4]')).toBeInTheDocument();

    // Check failed copy icon and message
    expect(screen.getByLabelText('dashboard')).toBeInTheDocument();
    expect(screen.getByText('dashboard [id=2]')).toBeInTheDocument();

    expect(screen.getByLabelText('config')).toBeInTheDocument();
    expect(screen.getByText('Failed Config Title')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    render(<DuplicateResultFlyoutComponent {...duplicateResultFlyoutProps} />);

    const closeButton = screen.getByTestId('euiFlyoutCloseButton');
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('copy count is null', () => {
    render(
      <DuplicateResultFlyoutComponent
        workspaceName={workspaceName}
        failedCopies={[]}
        successfulCopies={[]}
        onClose={onCloseMock}
      />
    );
    expect(document.children).toMatchSnapshot();
  });

  it('calls onClose after footer close button clicked', () => {
    render(<DuplicateResultFlyoutComponent {...duplicateResultFlyoutProps} />);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
