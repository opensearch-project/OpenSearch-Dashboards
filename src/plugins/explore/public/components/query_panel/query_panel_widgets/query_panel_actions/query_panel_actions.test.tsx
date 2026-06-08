/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
  prepareQueryForLanguage: jest.fn((query) => query),
}));

jest.mock('../../../../application/hooks/editor_hooks/use_editor_text/use_editor_text', () => ({
  useEditorText: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

import {
  selectQuery,
  selectOverallQueryStatus,
} from '../../../../application/utils/state_management/selectors';
import { useEditorText } from '../../../../application/hooks/editor_hooks/use_editor_text/use_editor_text';

const mockSelectQuery = selectQuery as jest.MockedFunction<typeof selectQuery>;
const mockSelectOverallQueryStatus = selectOverallQueryStatus as jest.MockedFunction<
  typeof selectOverallQueryStatus
>;
const mockUseEditorText = useEditorText as jest.MockedFunction<typeof useEditorText>;

const buildAction = (
  id: string,
  overrides: Partial<QueryPanelActionConfig> = {}
): QueryPanelActionConfig =>
  ({
    id,
    order: 1,
    actionType: 'button',
    getLabel: () => `label-${id}`,
    onClick: jest.fn(),
    ...overrides,
  } as QueryPanelActionConfig);

describe('QueryPanelActions', () => {
  let mockRegistry: jest.Mocked<QueryPanelActionsRegistryService>;
  let mockQuery: any;
  let mockResultStatus: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRegistry = {
      getSortedActions: jest.fn(),
      getAction: jest.fn(),
      isEmpty: jest.fn(),
      setup: jest.fn(),
    } as any;

    mockQuery = { query: 'SELECT * FROM table', language: 'sql' };
    mockResultStatus = { status: QueryExecutionStatus.READY };
  });

  const setupUseSelectorMock = () => {
    mockSelectQuery.mockReturnValue(mockQuery);
    mockSelectOverallQueryStatus.mockReturnValue(mockResultStatus);
    mockUseEditorText.mockReturnValue(() => 'SELECT * FROM table');
    mockUseSelector.mockImplementation((selector) => {
      if (selector === mockSelectQuery) return mockQuery;
      if (selector === mockSelectOverallQueryStatus) return mockResultStatus;
      return selector({} as any);
    });
  };

  // ---- Inline rendering (≤ INLINE_ACTION_LIMIT actions) -------------------

  describe('inline rendering', () => {
    it('renders nothing visible when no actions are registered', () => {
      setupUseSelectorMock();
      mockRegistry.getSortedActions.mockReturnValue([]);
      render(<QueryPanelActions registry={mockRegistry} />);
      // Nothing inline + no overflow button.
      expect(screen.queryByTestId('queryPanelFooterActionsButton')).not.toBeInTheDocument();
    });

    it('renders each registered action as an inline button when count is ≤ 5', () => {
      setupUseSelectorMock();
      const actions = [
        buildAction('a', { getLabel: () => 'Alpha' }),
        buildAction('b', { getLabel: () => 'Beta' }),
        buildAction('c', { getLabel: () => 'Gamma' }),
      ];
      mockRegistry.getSortedActions.mockReturnValue(actions);

      render(<QueryPanelActions registry={mockRegistry} />);

      expect(screen.getByTestId('queryPanelActionInline-a')).toBeInTheDocument();
      expect(screen.getByTestId('queryPanelActionInline-b')).toBeInTheDocument();
      expect(screen.getByTestId('queryPanelActionInline-c')).toBeInTheDocument();
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.getByText('Gamma')).toBeInTheDocument();
      // No overflow button.
      expect(screen.queryByTestId('queryPanelFooterActionsButton')).not.toBeInTheDocument();
    });

    it('clicking an inline button dispatches the action with current dependencies', () => {
      setupUseSelectorMock();
      const onClick = jest.fn();
      mockRegistry.getSortedActions.mockReturnValue([
        buildAction('act', { getLabel: () => 'Run', onClick }),
      ]);

      render(<QueryPanelActions registry={mockRegistry} />);
      fireEvent.click(screen.getByTestId('queryPanelActionInline-act'));

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith({
        query: mockQuery,
        resultStatus: mockResultStatus,
        queryInEditor: 'SELECT * FROM table',
      });
    });

    it('renders disabled inline buttons when getIsEnabled returns false', () => {
      setupUseSelectorMock();
      mockRegistry.getSortedActions.mockReturnValue([
        buildAction('off', {
          getLabel: () => 'Off',
          getIsEnabled: () => false,
        }),
      ]);

      render(<QueryPanelActions registry={mockRegistry} />);
      const btn = screen.getByTestId('queryPanelActionInline-off');
      expect(btn).toBeDisabled();
    });

    it('passes the live dependencies to getLabel / getIsEnabled / getIcon', () => {
      setupUseSelectorMock();
      const getLabel = jest.fn().mockReturnValue('Dynamic');
      const getIsEnabled = jest.fn().mockReturnValue(true);
      const getIcon = jest.fn().mockReturnValue('settings');
      mockRegistry.getSortedActions.mockReturnValue([
        buildAction('full', { getLabel, getIsEnabled, getIcon }),
      ]);

      render(<QueryPanelActions registry={mockRegistry} />);

      const expected = {
        query: mockQuery,
        resultStatus: mockResultStatus,
        queryInEditor: 'SELECT * FROM table',
      };
      expect(getLabel).toHaveBeenCalledWith(expected);
      expect(getIsEnabled).toHaveBeenCalledWith(expected);
      expect(getIcon).toHaveBeenCalledWith(expected);
    });
  });

  // ---- Overflow popover (> INLINE_ACTION_LIMIT actions) -------------------

  describe('overflow popover', () => {
    const buildSix = () =>
      Array.from({ length: 6 }, (_, i) => buildAction(`a${i}`, { getLabel: () => `Action ${i}` }));

    it('shows the first 5 inline and a "+1 more action" overflow button when 6 actions exist', () => {
      setupUseSelectorMock();
      mockRegistry.getSortedActions.mockReturnValue(buildSix());

      render(<QueryPanelActions registry={mockRegistry} />);

      // First 5 are inline.
      for (let i = 0; i < 5; i++) {
        expect(screen.getByTestId(`queryPanelActionInline-a${i}`)).toBeInTheDocument();
      }
      // Sixth is NOT inline.
      expect(screen.queryByTestId('queryPanelActionInline-a5')).not.toBeInTheDocument();
      // Overflow button is present, labeled with the remaining count.
      const overflow = screen.getByTestId('queryPanelFooterActionsButton');
      expect(overflow).toBeInTheDocument();
      // Singular form — `+1 more action` (not `actions`).
      expect(overflow).toHaveTextContent('+1 more action');
    });

    it('reveals the overflow actions inside the popover when clicked', () => {
      setupUseSelectorMock();
      mockRegistry.getSortedActions.mockReturnValue(buildSix());

      render(<QueryPanelActions registry={mockRegistry} />);
      fireEvent.click(screen.getByTestId('queryPanelFooterActionsButton'));

      // The 6th action is rendered inside the popover.
      expect(screen.getByTestId('queryPanelActionOverflow-a5')).toBeInTheDocument();
      expect(screen.getByText('Action 5')).toBeInTheDocument();
    });

    it('clicking an overflow action dispatches it with current dependencies', () => {
      setupUseSelectorMock();
      const onClick = jest.fn();
      const seven = [
        ...Array.from({ length: 5 }, (_, i) => buildAction(`a${i}`)),
        buildAction('overflow', { getLabel: () => 'Overflowed', onClick }),
      ];
      mockRegistry.getSortedActions.mockReturnValue(seven);

      render(<QueryPanelActions registry={mockRegistry} />);
      fireEvent.click(screen.getByTestId('queryPanelFooterActionsButton'));
      fireEvent.click(screen.getByTestId('queryPanelActionOverflow-overflow'));

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith({
        query: mockQuery,
        resultStatus: mockResultStatus,
        queryInEditor: 'SELECT * FROM table',
      });
    });

    it('renders the overflow button label as "+N more" plural-aware', () => {
      setupUseSelectorMock();
      // 5 inline + 3 overflow → plural form `+3 more actions`.
      const eight = Array.from({ length: 8 }, (_, i) => buildAction(`a${i}`));
      mockRegistry.getSortedActions.mockReturnValue(eight);

      render(<QueryPanelActions registry={mockRegistry} />);
      expect(screen.getByTestId('queryPanelFooterActionsButton')).toHaveTextContent(
        '+3 more actions'
      );
    });
  });
});
