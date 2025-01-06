/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsImportError, SavedObjectsImportSuccess } from 'opensearch-dashboards/public';
import { DuplicateResultFlyout, DuplicateResultFlyoutProps } from './duplicate_result_flyout';
import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

describe('DuplicateResultFlyout', () => {
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
  const onCopyMock = jest.fn();
  const duplicateResultFlyoutProps: DuplicateResultFlyoutProps = {
    workspaceName,
    failedCopies: [],
    successfulCopies,
    onClose: onCloseMock,
    onCopy: onCopyMock,
    targetWorkspace: 'target-workspace',
    useUpdatedUX: true,
    targetWorkspaceDataSourceUrl: '',
  };

  const DuplicateResultFlyoutComponent = (props: DuplicateResultFlyoutProps) => {
    return (
      <IntlProvider locale="en">
        <DuplicateResultFlyout {...props} />
      </IntlProvider>
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the flyout with correct title and successful results', () => {
    const { getByText, getByLabelText, getByTestId } = render(
      <DuplicateResultFlyoutComponent {...duplicateResultFlyoutProps} />
    );

    // Check title
    expect(getByText('Copy assets to targetWorkspace')).toBeInTheDocument();

    // Check result counts
    expect(getByText('2 assets copied')).toBeInTheDocument();
    expect(getByText('2 Successful')).toBeInTheDocument();

    // Check successful copy icon and message
    expect(getByLabelText('visualization')).toBeInTheDocument();
    expect(getByText('Successful Visualization Title')).toBeInTheDocument();

    expect(getByLabelText('search')).toBeInTheDocument();
    expect(getByText('search [id=4]')).toBeInTheDocument();

    // Calls onClose when the close button is clicked
    const closeButton = getByTestId('euiFlyoutCloseButton');
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('renders the flyout with correct callout and error results', () => {
    const failedCopies: SavedObjectsImportError[] = [
      {
        type: 'visualization',
        id: '1',
        meta: {},
        error: { type: 'missing_references', references: [] },
      },
      {
        type: 'data-source',
        id: '2',
        meta: {},
        error: {
          type: 'missing_data_source',
          dataSource: 'my-data-source',
        },
      },
    ];
    const { getByText, getByLabelText } = render(
      <DuplicateResultFlyoutComponent {...duplicateResultFlyoutProps} failedCopies={failedCopies} />
    );

    // Check title
    expect(getByText('Copy assets to targetWorkspace')).toBeInTheDocument();

    // Check missing reference callout title
    expect(getByText('Index Pattern Conflicts')).toBeInTheDocument();
    // Check failed copy icon and message
    expect(getByLabelText('visualization')).toBeInTheDocument();
    expect(getByText('visualization [id=1]')).toBeInTheDocument();

    // Check missing data source callout title
    expect(getByText('Missing Data Source')).toBeInTheDocument();
    // Check failed copy icon and message
    expect(getByLabelText('data-source')).toBeInTheDocument();
    expect(getByText('data-source [id=2]')).toBeInTheDocument();

    // Check copy remaining assets button
    const copyButton = getByText('Copy remaining 2 assets');
    expect(copyButton).toBeInTheDocument();

    // Calls onCopy when the button is clicked
    fireEvent.click(copyButton);
    expect(onCopyMock).toHaveBeenCalledTimes(1);
  });

  it('renders the flyout with success and error results', () => {
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
    const { getByText, getByLabelText } = render(
      <DuplicateResultFlyoutComponent {...duplicateResultFlyoutProps} failedCopies={failedCopies} />
    );

    // Check title
    expect(getByText('Copy assets to targetWorkspace')).toBeInTheDocument();

    // Check result counts
    expect(getByText('4 assets copied')).toBeInTheDocument();
    expect(getByText('2 Successful')).toBeInTheDocument();
    expect(getByText('2 Error copying file')).toBeInTheDocument();

    // Check successful copy icon and message
    expect(getByLabelText('visualization')).toBeInTheDocument();
    expect(getByText('Successful Visualization Title')).toBeInTheDocument();

    expect(getByLabelText('search')).toBeInTheDocument();
    expect(getByText('search [id=4]')).toBeInTheDocument();

    // Check failed copy icon and message
    expect(getByLabelText('config')).toBeInTheDocument();
    expect(getByText('Failed Config Title')).toBeInTheDocument();
    expect(getByLabelText('dashboard')).toBeInTheDocument();
    expect(getByText('dashboard [id=2]')).toBeInTheDocument();
  });

  it('renders correct if copy count is null', () => {
    const { getByText } = render(
      <DuplicateResultFlyoutComponent
        {...duplicateResultFlyoutProps}
        failedCopies={[]}
        successfulCopies={[]}
      />
    );

    // Check title
    expect(getByText('Copy assets to targetWorkspace')).toBeInTheDocument();

    // Check result counts
    expect(getByText('0 assets copied')).toBeInTheDocument();
  });

  it('calls onClose after footer close button clicked', () => {
    const { getByText } = render(
      <DuplicateResultFlyoutComponent {...duplicateResultFlyoutProps} />
    );

    const closeButton = getByText('Close');
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
