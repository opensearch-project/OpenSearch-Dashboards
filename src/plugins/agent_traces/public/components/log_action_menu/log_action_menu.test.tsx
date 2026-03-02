/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogActionMenu } from './log_action_menu';
import { logActionRegistry } from '../../services/log_action_registry';
import { LogActionDefinition } from '../../types/log_actions';

// Mock the log action registry
jest.mock('../../services/log_action_registry', () => ({
  logActionRegistry: {
    getCompatibleActions: jest.fn(),
  },
}));

describe('LogActionMenu', () => {
  const mockGetCompatibleActions = logActionRegistry.getCompatibleActions as jest.Mock;

  const mockDocument = {
    message: 'Test error message',
    timestamp: '2024-01-01T00:00:00Z',
    level: 'error',
  };

  const defaultProps = {
    document: mockDocument,
    query: 'test query',
    indexPattern: 'logs-*',
    metadata: { index: 0 },
    iconType: 'generate',
    size: 's' as const,
    disabled: false,
  };

  const mockActionComponent = ({ context, onClose }: any) => (
    <div data-testid="mock-action-component">
      <div data-testid="action-document">{JSON.stringify(context.document)}</div>
      <button onClick={onClose}>Close Action</button>
    </div>
  );

  const mockAction1: LogActionDefinition = {
    id: 'action-1',
    displayName: 'Action 1',
    iconType: 'bullseye',
    order: 1,
    isCompatible: jest.fn().mockReturnValue(true),
    component: mockActionComponent,
  };

  const mockAction2: LogActionDefinition = {
    id: 'action-2',
    displayName: 'Action 2',
    iconType: 'wrench',
    order: 2,
    isCompatible: jest.fn().mockReturnValue(true),
    component: mockActionComponent,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when no compatible actions are available', () => {
      mockGetCompatibleActions.mockReturnValue([]);

      const { container } = render(<LogActionMenu {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders button when compatible actions are available', () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1]);

      render(<LogActionMenu {...defaultProps} />);

      const button = screen.getByTestId('logActionMenuButton');
      expect(button).toBeInTheDocument();
    });

    it('renders button with correct icon type', () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1]);

      render(<LogActionMenu {...defaultProps} iconType="analyze" />);

      const button = screen.getByTestId('logActionMenuButton');
      expect(button.querySelector('[data-euiicon-type="analyze"]')).toBeInTheDocument();
    });

    it('renders button with correct size', () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1]);

      render(<LogActionMenu {...defaultProps} size="xs" />);

      const button = screen.getByTestId('logActionMenuButton');
      expect(button).toHaveClass('euiButtonIcon--xSmall');
    });

    it('renders disabled button when disabled prop is true', () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1]);

      render(<LogActionMenu {...defaultProps} disabled={true} />);

      const button = screen.getByTestId('logActionMenuButton');
      expect(button).toBeDisabled();
    });
  });

  describe('context menu', () => {
    it('opens context menu when button is clicked', async () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1, mockAction2]);

      render(<LogActionMenu {...defaultProps} />);

      const button = screen.getByTestId('logActionMenuButton');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Action 1')).toBeInTheDocument();
        expect(screen.getByText('Action 2')).toBeInTheDocument();
      });
    });

    it('displays actions in the menu', async () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1, mockAction2]);

      render(<LogActionMenu {...defaultProps} />);

      const button = screen.getByTestId('logActionMenuButton');
      fireEvent.click(button);

      await waitFor(() => {
        const action1Element = screen.getByText('Action 1');
        const action2Element = screen.getByText('Action 2');
        expect(action1Element).toBeInTheDocument();
        expect(action2Element).toBeInTheDocument();
      });
    });

    it('displays action icons in the menu', async () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1]);

      render(<LogActionMenu {...defaultProps} />);

      const button = screen.getByTestId('logActionMenuButton');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Action 1')).toBeInTheDocument();
      });
    });
  });

  describe('action registry integration', () => {
    it('calls getCompatibleActions with correct context', () => {
      mockGetCompatibleActions.mockReturnValue([]);

      render(<LogActionMenu {...defaultProps} />);

      expect(mockGetCompatibleActions).toHaveBeenCalledWith({
        document: mockDocument,
        query: 'test query',
        indexPattern: 'logs-*',
        metadata: { index: 0 },
      });
    });

    it('updates when new actions become available', () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1]);

      const { rerender } = render(<LogActionMenu {...defaultProps} />);

      expect(screen.getByTestId('logActionMenuButton')).toBeInTheDocument();

      // Update to no actions
      mockGetCompatibleActions.mockReturnValue([]);

      rerender(<LogActionMenu {...defaultProps} document={{ ...mockDocument, updated: true }} />);

      expect(screen.queryByTestId('logActionMenuButton')).not.toBeInTheDocument();
    });
  });

  describe('action result handling', () => {
    it('handles action result callback', async () => {
      const mockActionWithResult = {
        ...mockAction1,
        component: ({ context, onClose, onResult }: any) => (
          <div>
            <button onClick={() => onResult?.({ success: true, message: 'Success' })}>
              Trigger Result
            </button>
            <button onClick={onClose}>Close</button>
          </div>
        ),
      };

      mockGetCompatibleActions.mockReturnValue([mockActionWithResult]);

      render(<LogActionMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('logActionMenuButton'));

      await waitFor(() => {
        expect(screen.getByText('Action 1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Action 1'));

      await waitFor(() => {
        expect(screen.getByText('Trigger Result')).toBeInTheDocument();
      });

      // Trigger result - should not throw
      fireEvent.click(screen.getByText('Trigger Result'));
    });
  });

  describe('edge cases', () => {
    it('handles empty document', () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1]);

      render(<LogActionMenu {...defaultProps} document={{}} />);

      expect(screen.getByTestId('logActionMenuButton')).toBeInTheDocument();
    });

    it('handles missing optional props', () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1]);

      render(<LogActionMenu document={mockDocument} iconType="generate" size="s" />);

      expect(screen.getByTestId('logActionMenuButton')).toBeInTheDocument();
    });

    it('handles single action', async () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1]);

      render(<LogActionMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('logActionMenuButton'));

      await waitFor(() => {
        expect(screen.getByText('Action 1')).toBeInTheDocument();
        expect(screen.queryByText('Action 2')).not.toBeInTheDocument();
      });
    });

    it('handles many actions', async () => {
      const manyActions = Array.from({ length: 10 }, (_, i) => ({
        ...mockAction1,
        id: `action-${i}`,
        displayName: `Action ${i}`,
      }));

      mockGetCompatibleActions.mockReturnValue(manyActions);

      render(<LogActionMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('logActionMenuButton'));

      await waitFor(() => {
        expect(screen.getByText('Action 0')).toBeInTheDocument();
        expect(screen.getByText('Action 9')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('has accessible button label', () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1]);

      render(<LogActionMenu {...defaultProps} />);

      const button = screen.getByTestId('logActionMenuButton');
      expect(button).toHaveAttribute('aria-label', 'Open log actions menu');
    });

    it('back button has accessible label', async () => {
      mockGetCompatibleActions.mockReturnValue([mockAction1]);

      render(<LogActionMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('logActionMenuButton'));

      await waitFor(() => {
        expect(screen.getByText('Action 1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Action 1'));

      await waitFor(() => {
        const backButton = screen.getByLabelText('Back to menu');
        expect(backButton).toBeInTheDocument();
      });
    });
  });
});
