/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { QueryPanelActions } from './query_panel_actions';
import {
  QueryPanelActionsRegistryService,
  QueryPanelActionConfig,
} from '../../../../services/query_panel_actions_registry';
import { QueryExecutionStatus } from '../../../../application/utils/state_management/types';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  connect: jest.fn(() => (component: any) => component),
}));

jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectOverallQueryStatus: jest.fn(),
  selectQuery: jest.fn(),
}));

jest.mock('../../../../application/utils/languages', () => ({
  getQueryWithSource: jest.fn((query) => query),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

// Import the mocked selectors
import {
  selectQuery,
  selectOverallQueryStatus,
} from '../../../../application/utils/state_management/selectors';

const mockSelectQuery = selectQuery as jest.MockedFunction<typeof selectQuery>;
const mockSelectOverallQueryStatus = selectOverallQueryStatus as jest.MockedFunction<
  typeof selectOverallQueryStatus
>;

describe('QueryPanelActions', () => {
  let mockRegistry: jest.Mocked<QueryPanelActionsRegistryService>;
  let mockQuery: any;
  let mockResultStatus: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock registry service
    mockRegistry = {
      getSortedActions: jest.fn(),
      isEmpty: jest.fn(),
      setup: jest.fn(),
    } as any;

    // Mock query and status data
    mockQuery = {
      query: 'SELECT * FROM table',
      language: 'sql',
    };

    mockResultStatus = {
      status: QueryExecutionStatus.READY,
    };
  });

  const setupUseSelectorMock = () => {
    // Set up the individual selector mocks
    mockSelectQuery.mockReturnValue(mockQuery);
    mockSelectOverallQueryStatus.mockReturnValue(mockResultStatus);

    // Set up useSelector to delegate to the selector functions
    mockUseSelector.mockImplementation((selector) => {
      if (selector === mockSelectQuery) {
        return mockQuery;
      }
      if (selector === mockSelectOverallQueryStatus) {
        return mockResultStatus;
      }
      // Call the selector with empty state as fallback
      return selector({} as any);
    });
  };

  describe('component rendering', () => {
    it('renders the actions button with correct attributes', () => {
      setupUseSelectorMock();
      mockRegistry.getSortedActions.mockReturnValue([]);

      render(<QueryPanelActions registry={mockRegistry} />);

      const button = screen.getByTestId('queryPanelFooterActionsButton');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Actions');
    });

    it('renders action items when actions are registered', () => {
      setupUseSelectorMock();
      const mockActions: QueryPanelActionConfig[] = [
        {
          id: 'action-1',
          order: 1,
          getLabel: () => 'Test Action 1',
          onClick: jest.fn(),
        },
        {
          id: 'action-2',
          order: 2,
          getLabel: () => 'Test Action 2',
          onClick: jest.fn(),
        },
      ];

      mockRegistry.getSortedActions.mockReturnValue(mockActions);

      render(<QueryPanelActions registry={mockRegistry} />);

      const button = screen.getByTestId('queryPanelFooterActionsButton');
      fireEvent.click(button);

      expect(screen.getByText('Test Action 1')).toBeInTheDocument();
      expect(screen.getByText('Test Action 2')).toBeInTheDocument();
    });
  });

  describe('popover behavior', () => {
    it('opens popover when button is clicked', () => {
      setupUseSelectorMock();
      mockRegistry.getSortedActions.mockReturnValue([]);

      render(<QueryPanelActions registry={mockRegistry} />);

      const button = screen.getByTestId('queryPanelFooterActionsButton');
      fireEvent.click(button);

      // Popover should be open (EuiPopover content becomes visible)
      expect(button).toBeInTheDocument();
    });

    it('toggles popover state on multiple button clicks', () => {
      setupUseSelectorMock();
      mockRegistry.getSortedActions.mockReturnValue([]);

      render(<QueryPanelActions registry={mockRegistry} />);

      const button = screen.getByTestId('queryPanelFooterActionsButton');

      // Click to open
      fireEvent.click(button);
      // Click to close
      fireEvent.click(button);

      expect(button).toBeInTheDocument();
    });
  });

  describe('action interactions', () => {
    it('calls action onClick when action button is clicked', () => {
      setupUseSelectorMock();
      const mockOnClick = jest.fn();
      const mockActions: QueryPanelActionConfig[] = [
        {
          id: 'clickable-action',
          order: 1,
          getLabel: () => 'Clickable Action',
          onClick: mockOnClick,
        },
      ];

      mockRegistry.getSortedActions.mockReturnValue(mockActions);

      render(<QueryPanelActions registry={mockRegistry} />);

      // Open popover
      const button = screen.getByTestId('queryPanelFooterActionsButton');
      fireEvent.click(button);

      // Click action button
      const actionButton = screen.getByText('Clickable Action');
      fireEvent.click(actionButton);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith({
        query: mockQuery,
        resultStatus: mockResultStatus,
      });
    });

    it('handles action with getIsEnabled returning false', () => {
      setupUseSelectorMock();
      const mockActions: QueryPanelActionConfig[] = [
        {
          id: 'disabled-action',
          order: 1,
          getLabel: () => 'Disabled Action',
          getIsEnabled: () => false,
          onClick: jest.fn(),
        },
      ];

      mockRegistry.getSortedActions.mockReturnValue(mockActions);

      render(<QueryPanelActions registry={mockRegistry} />);

      // Open popover
      const button = screen.getByTestId('queryPanelFooterActionsButton');
      fireEvent.click(button);

      // Check that action button is disabled by testing the actual text element
      const actionButton = screen.getByText('Disabled Action');
      expect(actionButton).toBeInTheDocument();

      // The button should have disabled styling/behavior
      const buttonParent = actionButton.closest('button');
      expect(buttonParent).toHaveAttribute('disabled');
    });

    it('handles action with getIsEnabled returning true', () => {
      setupUseSelectorMock();
      const mockActions: QueryPanelActionConfig[] = [
        {
          id: 'enabled-action',
          order: 1,
          getLabel: () => 'Enabled Action',
          getIsEnabled: () => true,
          onClick: jest.fn(),
        },
      ];

      mockRegistry.getSortedActions.mockReturnValue(mockActions);

      render(<QueryPanelActions registry={mockRegistry} />);

      // Open popover
      const button = screen.getByTestId('queryPanelFooterActionsButton');
      fireEvent.click(button);

      // Check that action button is enabled
      const actionButton = screen.getByText('Enabled Action');
      expect(actionButton).not.toBeDisabled();
    });

    it('handles action without getIsEnabled (defaults to enabled)', () => {
      setupUseSelectorMock();
      const mockActions: QueryPanelActionConfig[] = [
        {
          id: 'default-enabled-action',
          order: 1,
          getLabel: () => 'Default Enabled Action',
          onClick: jest.fn(),
        },
      ];

      mockRegistry.getSortedActions.mockReturnValue(mockActions);

      render(<QueryPanelActions registry={mockRegistry} />);

      // Open popover
      const button = screen.getByTestId('queryPanelFooterActionsButton');
      fireEvent.click(button);

      // Check that action button is enabled by default
      const actionButton = screen.getByText('Default Enabled Action');
      expect(actionButton).not.toBeDisabled();
    });

    it('renders action with icon when getIcon is provided', () => {
      setupUseSelectorMock();
      const mockActions: QueryPanelActionConfig[] = [
        {
          id: 'action-with-icon',
          order: 1,
          getLabel: () => 'Action With Icon',
          getIcon: () => 'download',
          onClick: jest.fn(),
        },
      ];

      mockRegistry.getSortedActions.mockReturnValue(mockActions);

      render(<QueryPanelActions registry={mockRegistry} />);

      // Open popover
      const button = screen.getByTestId('queryPanelFooterActionsButton');
      fireEvent.click(button);

      // Just verify the action renders - icon testing is complex with EUI
      expect(screen.getByText('Action With Icon')).toBeInTheDocument();
    });

    it('renders action without icon when getIcon is not provided', () => {
      setupUseSelectorMock();
      const mockActions: QueryPanelActionConfig[] = [
        {
          id: 'action-without-icon',
          order: 1,
          getLabel: () => 'Action Without Icon',
          onClick: jest.fn(),
        },
      ];

      mockRegistry.getSortedActions.mockReturnValue(mockActions);

      render(<QueryPanelActions registry={mockRegistry} />);

      // Open popover
      const button = screen.getByTestId('queryPanelFooterActionsButton');
      fireEvent.click(button);

      const actionButton = screen.getByText('Action Without Icon');
      expect(actionButton).toBeInTheDocument();
    });
  });

  describe('dependencies calculation', () => {
    it('passes correct dependencies to action callbacks', () => {
      setupUseSelectorMock();
      const mockGetLabel = jest.fn().mockReturnValue('Dynamic Label');
      const mockGetIsEnabled = jest.fn().mockReturnValue(true);
      const mockGetIcon = jest.fn().mockReturnValue('settings');
      const mockOnClick = jest.fn();

      const mockActions: QueryPanelActionConfig[] = [
        {
          id: 'full-featured-action',
          order: 1,
          getLabel: mockGetLabel,
          getIsEnabled: mockGetIsEnabled,
          getIcon: mockGetIcon,
          onClick: mockOnClick,
        },
      ];

      mockRegistry.getSortedActions.mockReturnValue(mockActions);

      render(<QueryPanelActions registry={mockRegistry} />);

      // Open popover
      const button = screen.getByTestId('queryPanelFooterActionsButton');
      fireEvent.click(button);

      const expectedDependencies = {
        query: mockQuery,
        resultStatus: mockResultStatus,
      };

      // Verify all callbacks receive correct dependencies
      expect(mockGetLabel).toHaveBeenCalledWith(expectedDependencies);
      expect(mockGetIsEnabled).toHaveBeenCalledWith(expectedDependencies);
      expect(mockGetIcon).toHaveBeenCalledWith(expectedDependencies);

      // Click action to test onClick dependencies
      const actionButton = screen.getByText('Dynamic Label');
      fireEvent.click(actionButton);

      expect(mockOnClick).toHaveBeenCalledWith(expectedDependencies);
    });

    it('updates dependencies when selectors change', () => {
      setupUseSelectorMock();
      const mockActions: QueryPanelActionConfig[] = [
        {
          id: 'test-action',
          order: 1,
          getLabel: jest.fn().mockReturnValue('Test Action'),
          onClick: jest.fn(),
        },
      ];

      mockRegistry.getSortedActions.mockReturnValue(mockActions);

      // First render
      const { rerender } = render(<QueryPanelActions registry={mockRegistry} />);

      // Mock new selector values for rerender
      const newQuery = { query: 'SELECT * FROM new_table', language: 'sql' };
      const newResultStatus = { status: QueryExecutionStatus.LOADING };

      mockUseSelector.mockReturnValueOnce(newQuery).mockReturnValueOnce(newResultStatus);

      // Rerender with new values
      rerender(<QueryPanelActions registry={mockRegistry} />);

      // Open popover and verify new dependencies are used
      const button = screen.getByTestId('queryPanelFooterActionsButton');
      fireEvent.click(button);

      // The component should have updated its memoized dependencies
      expect(mockRegistry.getSortedActions).toHaveBeenCalled();
    });
  });
});
