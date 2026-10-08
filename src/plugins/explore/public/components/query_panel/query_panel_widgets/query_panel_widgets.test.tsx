/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { QueryPanelWidgets } from './query_panel_widgets';
import { useDatasetContext } from '../../../application/context';
import { useSelector } from 'react-redux';
import { QueryPanelActionsRegistryService } from '../../../services/query_panel_actions_registry';
import {
  selectIsPromptEditorMode,
  selectQueryLanguage,
} from '../../../application/utils/state_management/selectors';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  connect: jest.fn(() => (component: any) => component),
  Provider: ({ children }: any) => children,
}));

// Mock the selectors
jest.mock('../../../application/utils/state_management/selectors', () => ({
  selectQueryStatus: jest.fn(),
  selectEditorMode: jest.fn(),
  selectQueryLanguage: jest.fn(() => 'PPL'),
  selectIsPromptEditorMode: jest.fn(() => false),
}));

// Mock opensearch-dashboards-react
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

// Mock all child components
jest.mock('./dataset_select', () => ({
  DatasetSelectWidget: () => <div data-test-subj="dataset-select-widget">Dataset Select</div>,
}));

jest.mock('./save_query', () => ({
  SaveQueryButton: () => <div data-test-subj="save-query-button">Save Query</div>,
}));

jest.mock('./recent_queries_button', () => ({
  RecentQueriesButton: () => <div data-test-subj="recent-queries-button">Recent Queries</div>,
}));

jest.mock('./language_toggle', () => ({
  LanguageToggle: () => <div data-test-subj="language-toggle">Language Toggle</div>,
}));

jest.mock('./query_panel_actions', () => ({
  QueryPanelActions: ({ registry }: { registry: QueryPanelActionsRegistryService }) => (
    <div data-test-subj="query-panel-actions" data-registry-empty={registry.isEmpty()}>
      Query Panel Actions
    </div>
  ),
}));

jest.mock('./ask_ai_button', () => ({
  AskAIButton: () => <div data-test-subj="ask-ai-button">Ask AI Button</div>,
}));

jest.mock('../../../helpers/use_flavor_id', () => ({
  useFlavorId: jest.fn(() => 'logs'),
}));

jest.mock('./use_analyze_panel_state', () => ({
  useAnalyzePanelState: jest.fn(() => ({
    isOpen: false,
    setIsOpen: jest.fn(),
    hasResult: false,
    isLoading: false,
  })),
}));

jest.mock('../../../application/context', () => ({
  useDatasetContext: jest.fn(),
}));

const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;
const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

describe('QueryPanelWidgets', () => {
  const mockQueryStatus = {
    status: 'ready',
    elapsedMs: 150,
    startTime: Date.now(),
    body: undefined,
  };

  let mockQueryPanelActionsRegistry: jest.Mocked<QueryPanelActionsRegistryService>;
  let mockUseOpenSearchDashboards: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock registry service
    mockQueryPanelActionsRegistry = {
      isEmpty: jest.fn(),
      getSortedActions: jest.fn(),
      setup: jest.fn(),
    } as any;

    // Mock useOpenSearchDashboards

    mockUseOpenSearchDashboards =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('../../../../../opensearch_dashboards_react/public').useOpenSearchDashboards;
    mockUseOpenSearchDashboards.mockReturnValue({
      services: {
        queryPanelActionsRegistry: mockQueryPanelActionsRegistry,
      },
    });

    // Mock useSelector to return queryStatus since that's the only selector used now
    mockUseSelector.mockReturnValue(mockQueryStatus);

    // Mock useDatasetContext default return
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });
  });

  describe('component rendering', () => {
    it('renders all basic components with correct layout', () => {
      mockQueryPanelActionsRegistry.isEmpty.mockReturnValue(true);

      const { container } = render(<QueryPanelWidgets />);

      // Check main container
      expect(container.querySelector('.exploreQueryPanelWidgets')).toBeInTheDocument();

      // Check left section components
      expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('dataset-select-widget')).toBeInTheDocument();
      expect(screen.getByTestId('recent-queries-button')).toBeInTheDocument();
      expect(screen.getByTestId('save-query-button')).toBeInTheDocument();

      // Check separators exist
      const separators = container.querySelectorAll('.exploreQueryPanelWidgets__verticalSeparator');
      expect(separators).toHaveLength(2); // Only 2 separators when actions are not shown
    });

    it('does not render query panel actions when registry is empty', () => {
      mockQueryPanelActionsRegistry.isEmpty.mockReturnValue(true);

      render(<QueryPanelWidgets />);

      expect(mockQueryPanelActionsRegistry.isEmpty).toHaveBeenCalled();
      expect(screen.queryByTestId('query-panel-actions')).not.toBeInTheDocument();
    });

    it('renders query panel actions when registry is not empty', () => {
      mockQueryPanelActionsRegistry.isEmpty.mockReturnValue(false);

      const { container } = render(<QueryPanelWidgets />);

      expect(mockQueryPanelActionsRegistry.isEmpty).toHaveBeenCalled();
      expect(screen.getByTestId('query-panel-actions')).toBeInTheDocument();

      // Check that there are 3 separators when actions are shown
      const separators = container.querySelectorAll('.exploreQueryPanelWidgets__verticalSeparator');
      expect(separators).toHaveLength(3);
    });

    it('passes the correct registry prop to QueryPanelActions', () => {
      mockQueryPanelActionsRegistry.isEmpty.mockReturnValue(false);

      render(<QueryPanelWidgets />);

      const actionsComponent = screen.getByTestId('query-panel-actions');
      expect(actionsComponent).toHaveAttribute('data-registry-empty', 'false');
    });
  });

  describe('layout structure', () => {
    it('maintains correct component order in left section', () => {
      mockQueryPanelActionsRegistry.isEmpty.mockReturnValue(false);

      const { container } = render(<QueryPanelWidgets />);

      const leftSection = container.querySelector('.exploreQueryPanelWidgets__left');
      expect(leftSection).toBeInTheDocument();

      // Check the order of components within left section
      const childNodes = Array.from(leftSection!.children);
      const testSubjects = childNodes
        .filter((node) => node.getAttribute('data-test-subj'))
        .map((node) => node.getAttribute('data-test-subj'));

      expect(testSubjects).toEqual([
        'language-toggle',
        'dataset-select-widget',
        'recent-queries-button',
        'save-query-button',
        'query-panel-actions',
      ]);
    });

    it('maintains correct component order in right section', () => {
      mockQueryPanelActionsRegistry.isEmpty.mockReturnValue(true);

      const { container } = render(<QueryPanelWidgets />);

      const rightSection = container.querySelector('.exploreQueryPanelWidgets__right');
      expect(rightSection).toBeInTheDocument();

      const childNodes = Array.from(rightSection!.children);
      const testSubjects = childNodes
        .filter((node) => node.getAttribute('data-test-subj'))
        .map((node) => node.getAttribute('data-test-subj'));

      expect(testSubjects).toEqual(['ask-ai-button']);
    });
  });

  describe('inspect query button', () => {
    // The shared `mockUseSelector.mockReturnValue` in beforeEach hands every selector the same
    // object, which is enough for the query-status paths but not here: the button's visibility
    // depends on two specific selectors, so they have to be answered individually.
    const mockLanguageAndMode = (queryLanguage: string, isPromptMode: boolean) => {
      mockUseSelector.mockImplementation((selector: any) => {
        if (selector === selectQueryLanguage) return queryLanguage;
        if (selector === selectIsPromptEditorMode) return isPromptMode;
        return mockQueryStatus;
      });
    };

    beforeEach(() => {
      mockQueryPanelActionsRegistry.isEmpty.mockReturnValue(true);
    });

    it('renders the Inspect Query button for PPL queries in query mode', () => {
      mockLanguageAndMode('PPL', false);

      render(<QueryPanelWidgets onToggleAnalyze={jest.fn()} />);

      expect(screen.getByTestId('exploreAnalyzeButton')).toBeInTheDocument();
      expect(screen.getByText('Inspect Query')).toBeInTheDocument();
    });

    it('wraps the label in extra-small EuiText so it matches the other toolbar buttons', () => {
      mockLanguageAndMode('PPL', false);

      render(<QueryPanelWidgets onToggleAnalyze={jest.fn()} />);

      // Guards the sizing fix: without the EuiText wrapper the label inherits the surrounding
      // font size and renders visibly larger than its neighbors (e.g. Explore logs).
      expect(screen.getByText('Inspect Query').closest('.euiText')).toHaveClass(
        'euiText--extraSmall'
      );
    });

    it('calls onToggleAnalyze when clicked', () => {
      mockLanguageAndMode('PPL', false);
      const onToggleAnalyze = jest.fn();

      render(<QueryPanelWidgets onToggleAnalyze={onToggleAnalyze} />);
      screen.getByTestId('exploreAnalyzeButton').click();

      expect(onToggleAnalyze).toHaveBeenCalledTimes(1);
    });

    it('does not render the button for SQL queries', () => {
      mockLanguageAndMode('SQL', false);

      render(<QueryPanelWidgets onToggleAnalyze={jest.fn()} />);

      expect(screen.queryByTestId('exploreAnalyzeButton')).not.toBeInTheDocument();
    });

    it('does not render the button in prompt mode', () => {
      mockLanguageAndMode('PPL', true);

      render(<QueryPanelWidgets onToggleAnalyze={jest.fn()} />);

      expect(screen.queryByTestId('exploreAnalyzeButton')).not.toBeInTheDocument();
    });

    it('does not render the button when onToggleAnalyze is not provided', () => {
      mockLanguageAndMode('PPL', false);

      render(<QueryPanelWidgets />);

      expect(screen.queryByTestId('exploreAnalyzeButton')).not.toBeInTheDocument();
    });
  });

  describe('service integration', () => {
    it('correctly accesses queryPanelActionsRegistry from services', () => {
      mockQueryPanelActionsRegistry.isEmpty.mockReturnValue(true);

      render(<QueryPanelWidgets />);

      expect(mockUseOpenSearchDashboards).toHaveBeenCalled();
      expect(mockQueryPanelActionsRegistry.isEmpty).toHaveBeenCalled();
    });
  });
});
