/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceUseCaseFlyout } from './workspace_use_case_flyout';

const mockAvailableUseCases = [
  {
    id: 'use-case-1',
    icon: 'logoElasticsearch',
    title: 'Use Case 1',
    description: 'This is the description for Use Case 1',
    features: [
      {
        id: 'feature-1',
        title: 'Feature 1',
        details: ['Detail 1', 'Detail 2'],
      },
      {
        id: 'feature-2',
        title: 'Feature 2',
        details: [],
      },
    ],
  },
  {
    id: 'use-case-2',
    icon: 'logoKibana',
    title: 'Use Case 2',
    description: 'This is the description for Use Case 2',
    features: [],
  },
];

describe('WorkspaceUseCaseFlyout', () => {
  it('should render the flyout with the correct title and available use cases', () => {
    render(
      <WorkspaceUseCaseFlyout onClose={jest.fn()} availableUseCases={mockAvailableUseCases} />
    );
    const title = screen.getByText('Use cases');
    expect(title).toBeInTheDocument();
    expect(screen.getByText(mockAvailableUseCases[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockAvailableUseCases[0].title)).toBeInTheDocument();
  });

  it('should call the onClose callback when the close button is clicked', () => {
    const onCloseMock = jest.fn();
    render(
      <WorkspaceUseCaseFlyout onClose={onCloseMock} availableUseCases={mockAvailableUseCases} />
    );
    const closeButton = screen.getByTestId('euiFlyoutCloseButton');
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should expand the default use case if provided', () => {
    render(
      <WorkspaceUseCaseFlyout
        onClose={jest.fn()}
        availableUseCases={mockAvailableUseCases}
        defaultExpandUseCase="use-case-1"
      />
    );
    const useCaseDescription = screen.getByText(/This is the description for Use Case 1/);
    expect(useCaseDescription).toBeInTheDocument();
  });
});
