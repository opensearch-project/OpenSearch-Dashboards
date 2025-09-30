/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { showDeleteDetailsModal } from './show_delete_details_modal'; // Correct import path
import { WorkspaceAttribute, OverlayRef } from 'opensearch-dashboards/public'; // Import OverlayRef

const mockOpenModal = jest.fn(
  (node: React.ReactNode): OverlayRef => {
    const close = jest.fn();
    const modalInstance: OverlayRef = {
      close,
      onClose: Promise.resolve(),
    };

    return modalInstance;
  }
);

describe('showDeleteDetailsModal', () => {
  let modalClose: () => void;

  it('should render the modal with correct details for successful deletions', async () => {
    // Arrange
    const selectedWorkspaces: WorkspaceAttribute[] = [
      { id: '1', name: 'Workspace A' },
      { id: '2', name: 'Workspace B' },
    ];
    const failedWorkspaces: WorkspaceAttribute[] = [];
    modalClose = jest.fn();
    mockOpenModal.mockImplementation((node: React.ReactNode) => {
      const close = jest.fn();
      modalClose = close;
      render(<div>{node}</div>);
      return { close, onClose: Promise.resolve() };
    });

    // Act
    showDeleteDetailsModal(selectedWorkspaces, failedWorkspaces, mockOpenModal); // *Render the modal content*

    // Assert
    expect(mockOpenModal).toHaveBeenCalled();
    expect(screen.getByTestId('delete-details-modal-header')).toBeInTheDocument();
    expect(screen.getByTestId('delete-details-modal-title')).toBeInTheDocument();
    expect(screen.getByTestId('delete-details-modal-body')).toBeInTheDocument();
    expect(screen.getByTestId('delete-details-modal-list')).toBeInTheDocument();
    expect(screen.getByText('Delete team details')).toBeInTheDocument();
    expect(screen.getByText('started to delete workspaces')).toBeInTheDocument();
    expect(screen.getAllByTestId('delete-details-modal-name')).toHaveLength(2);

    // Check for success badges
    const successBadges = screen.getAllByTestId('delete-details-modal-bager-success');
    expect(successBadges).toHaveLength(2);
  });

  it('should render the modal with correct details for mixed success and failures', () => {
    // Arrange
    const selectedWorkspaces: WorkspaceAttribute[] = [
      { id: '1', name: 'Workspace A' },
      { id: '2', name: 'Workspace B' },
      { id: '3', name: 'Workspace C' },
    ];
    const failedWorkspaces = [{ id: '2', name: 'Workspace B' }];

    mockOpenModal.mockImplementation((node: React.ReactNode) => {
      const close = jest.fn();
      modalClose = close;
      render(<div>{node}</div>);
      return { close, onClose: Promise.resolve() };
    });

    // Act
    showDeleteDetailsModal(selectedWorkspaces, failedWorkspaces, mockOpenModal); // *Render the modal content*

    // Assert
    expect(mockOpenModal).toHaveBeenCalled();
    expect(screen.getByTestId('delete-details-modal-header')).toBeInTheDocument();
    expect(screen.getByTestId('delete-details-modal-body')).toBeInTheDocument();
    expect(screen.getByTestId('delete-details-modal-list')).toBeInTheDocument();
    expect(screen.getByText('Delete team details')).toBeInTheDocument();
    expect(screen.getByText('started to delete workspaces')).toBeInTheDocument();
    expect(screen.getAllByTestId('delete-details-modal-name')).toHaveLength(3);

    // Check for badges.
    const successBadges = screen.getAllByTestId('delete-details-modal-bager-success');
    const failureBadge = screen.getByTestId('delete-details-modal-bager-danger');
    expect(successBadges).toHaveLength(2);
    expect(failureBadge).toBeInTheDocument();
  });

  it('should render the modal with correct details for all failures', () => {
    // Arrange
    const selectedWorkspaces: WorkspaceAttribute[] = [
      { id: '1', name: 'Workspace A' },
      { id: '2', name: 'Workspace B' },
    ];
    const failedWorkspaces: WorkspaceAttribute[] = [
      { id: '1', name: 'Workspace A' },
      { id: '2', name: 'Workspace B' },
    ];

    mockOpenModal.mockImplementation((node: React.ReactNode) => {
      const close = jest.fn();
      modalClose = close;
      render(<div>{node}</div>);
      return { close, onClose: Promise.resolve() };
    });

    // Act
    showDeleteDetailsModal(selectedWorkspaces, failedWorkspaces, mockOpenModal); // *Render the modal content*

    // Assert
    expect(mockOpenModal).toHaveBeenCalled();
    expect(screen.getByTestId('delete-details-modal-header')).toBeInTheDocument();
    expect(screen.getByTestId('delete-details-modal-body')).toBeInTheDocument();
    expect(screen.getByTestId('delete-details-modal-list')).toBeInTheDocument();
    expect(screen.getByText('Delete team details')).toBeInTheDocument();
    expect(screen.getByText('started to delete workspaces')).toBeInTheDocument();
    expect(screen.getAllByTestId('delete-details-modal-name')).toHaveLength(2);

    // Check for failure badges
    const failureBadges = screen.getAllByTestId('delete-details-modal-bager-danger');
    expect(failureBadges).toHaveLength(2);
  });

  it('should close the modal when the Close button is clicked', () => {
    // Arrange
    const selectedWorkspaces = [{ id: '1', name: 'Workspace A' }];
    const failedWorkspaces: WorkspaceAttribute[] = [];
    modalClose = jest.fn();
    mockOpenModal.mockImplementation((node: React.ReactNode) => {
      const close = jest.fn();
      modalClose = close;
      render(<div>{node}</div>);
      return { close, onClose: Promise.resolve() };
    });

    showDeleteDetailsModal(selectedWorkspaces, failedWorkspaces, mockOpenModal);

    // Act
    const closeButton = screen.getByTestId('delete-details-modal-close-button');
    fireEvent.click(closeButton);

    // Assert
    expect(modalClose).toHaveBeenCalled();
  });
});
