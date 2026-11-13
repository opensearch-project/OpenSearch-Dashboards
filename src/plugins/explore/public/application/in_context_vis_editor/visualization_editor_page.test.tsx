/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, waitFor } from '@testing-library/react';
import { VisualizationEditorPage } from './visualization_editor_page';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { useInitialSaveExplore } from './hooks/use_initial_save_explore';
import { useInitialContainerContext } from './hooks/use_initial_container_context';
import { useQueryBuilderState } from './hooks/use_query_builder_state';
import { useMultiQueryBuilder } from './multi_query_builder/multi_query_builder_context';
import { useVisualizationBuilder } from './hooks/use_visualization_builder';
import { useHeaderVariants } from '../utils/hooks/use_header_variants';
import { syncQueryStateWithUrl } from '../../../../data/public';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options.defaultMessage),
  },
}));

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));
jest.mock('./hooks/use_initial_save_explore', () => ({
  useInitialSaveExplore: jest.fn(),
}));
jest.mock('./hooks/use_initial_container_context', () => ({
  useInitialContainerContext: jest.fn(),
}));
jest.mock('./hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));
// The page reads the container from the session's context and loads it from the resolved state.
jest.mock('./multi_query_builder/multi_query_builder_context', () => ({
  useMultiQueryBuilder: jest.fn(),
}));
jest.mock('./multi_query_builder/container_state_utils', () => ({
  // loadContainerState: jest.fn().mockResolvedValue({ queries: [], editorState: { rows: [] } }),
  loadContainerState: jest.fn().mockResolvedValue({
    state: { queries: [], editorState: { rows: [] } },
    warnings: [],
  }),
  showContainerStateWarnings: jest.fn(),
}));
jest.mock('./hooks/use_visualization_builder', () => ({ useVisualizationBuilder: jest.fn() }));
jest.mock('./query_builder/query_builder', () => ({ getQueryBuilder: jest.fn() }));
jest.mock('../utils/hooks/use_header_variants');
jest.mock('./hooks/use_variables', () => ({
  useVariables: jest.fn().mockReturnValue({ variableService: undefined }),
}));
jest.mock('../../../../data/public', () => ({ syncQueryStateWithUrl: jest.fn() }));
jest.mock('./component/visualization_editor_bottom_left_container', () => ({
  ResizableQueryPanelAndVisualization: () => <div data-test-subj="query-panel" />,
}));
jest.mock('./component/top_nav', () => ({
  TopNav: () => <div data-test-subj="top-nav" />,
}));
jest.mock('./component/visualization_editor_right_container', () => ({
  RightStyleOptionsPanel: () => <div data-test-subj="right-panel" />,
}));

const mockQueryBuilder = {
  init: jest.fn().mockResolvedValue(undefined),
  executeQuery: jest.fn(),
  reset: jest.fn(),
  queryState$: { getValue: jest.fn().mockReturnValue({ query: '' }) },
};

// The page lifecycle (init / execute on load / reset / variable names) goes through the container.
const mockContainer = {
  // init: jest.fn().mockResolvedValue(undefined),
  isLoaded: jest.fn().mockReturnValue(false),
  load: jest.fn(),
  executeAll: jest.fn(),
  reset: jest.fn(),
  getAllRows: jest.fn(() => [mockQueryBuilder]),
  setVariableNames: jest.fn(),
  setSavedBaseline: jest.fn(),
};

const mockVisualizationBuilder = {
  setVisConfig: jest.fn(),
  init: jest.fn(),
  reset: jest.fn(),
  visConfig$: { getValue: jest.fn() },
  setSavedBaseline: jest.fn(),
};

const mockServices = {
  core: { application: { navigateToApp: jest.fn() } },
  scopedHistory: { push: jest.fn() },
  chrome: {
    docTitle: { change: jest.fn() },
    recentlyAccessed: { add: jest.fn() },
    setBreadcrumbs: jest.fn(),
  },
  osdUrlStateStorage: { set: jest.fn(), get: jest.fn() },
  data: { query: {} },
  embeddable: { getStateTransfer: jest.fn().mockReturnValue({}) },
  dashboard: { VariablesBar: () => null, getActiveVariables: jest.fn() },
};

beforeEach(() => {
  jest.clearAllMocks();

  (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: mockServices });
  // (useQueryBuilderState as jest.Mock).mockReturnValue({ queryBuilder: mockQueryBuilder });
  (useQueryBuilderState as jest.Mock).mockReturnValue({
    queryBuilder: mockQueryBuilder,
    container: mockContainer,
  });
  (useMultiQueryBuilder as jest.Mock).mockReturnValue(mockContainer);
  (useVisualizationBuilder as jest.Mock).mockReturnValue({
    visualizationBuilderForEditor: mockVisualizationBuilder,
  });
  (useInitialContainerContext as jest.Mock).mockReturnValue({
    context: { originatingApp: undefined, containerInfo: undefined },
  });
  (useHeaderVariants as jest.Mock).mockReturnValue(undefined);
  (syncQueryStateWithUrl as jest.Mock).mockReturnValue({ stop: jest.fn() });
});

const renderPage = () => render(<VisualizationEditorPage setHeaderActionMenu={jest.fn()} />);

describe('VisualizationEditorPage', () => {
  it('renders null while loading', () => {
    (useInitialSaveExplore as jest.Mock).mockReturnValue({
      savedExplore: undefined,
      isLoading: true,
      error: undefined,
      savedQueryState: undefined,
      savedVisConfig: undefined,
    });

    const { container } = renderPage();
    expect(container.firstChild).toBeNull();
  });

  it('renders page content after initialization', async () => {
    (useInitialSaveExplore as jest.Mock).mockReturnValue({
      savedExplore: { id: '1', title: 'My Explore' },
      isLoading: false,
      error: undefined,
      savedQueryState: { query: 'source=logs' },
      savedVisConfig: undefined,
    });

    const { getByTestId } = renderPage();

    await waitFor(() => {
      expect(getByTestId('top-nav')).toBeInTheDocument();
      expect(getByTestId('query-panel')).toBeInTheDocument();
      expect(getByTestId('right-panel')).toBeInTheDocument();
    });
  });

  it('redirects to default path on error', async () => {
    (useInitialSaveExplore as jest.Mock).mockReturnValue({
      savedExplore: { id: '1', title: 'My Explore' },
      isLoading: false,
      error: new Error('not found'),
      savedQueryState: undefined,
      savedVisConfig: undefined,
    });

    renderPage();

    await waitFor(() => {
      expect(mockServices.scopedHistory.push).toHaveBeenCalledWith('/#');
    });
  });

  it('sets breadcrumbs and doc title for existing saved explore', async () => {
    (useInitialSaveExplore as jest.Mock).mockReturnValue({
      savedExplore: { id: '42', title: 'Chart' },
      isLoading: false,
      error: undefined,
      savedQueryState: undefined,
      savedVisConfig: undefined,
    });

    renderPage();

    await waitFor(() => {
      expect(mockServices.chrome.docTitle.change).toHaveBeenCalledWith('Chart');
      expect(mockServices.chrome.setBreadcrumbs).toHaveBeenCalled();
    });
  });

  it('applies saved vis config when present', async () => {
    (useInitialSaveExplore as jest.Mock).mockReturnValue({
      savedExplore: { id: '1', title: 'My Explore' },
      isLoading: false,
      error: undefined,
      savedQueryState: undefined,
      savedVisConfig: {
        chartType: 'bar',
        title: 'Panel title',
        description: 'Panel description',
      },
    });

    renderPage();

    await waitFor(() => {
      expect(mockVisualizationBuilder.setVisConfig).toHaveBeenCalledWith({
        type: 'bar',
        title: 'Panel title',
        description: 'Panel description',
      });
    });
  });

  it('executes query on load for existing saved explore', async () => {
    (useInitialSaveExplore as jest.Mock).mockReturnValue({
      savedExplore: { id: '1', title: 'My Explore' },
      isLoading: false,
      error: undefined,
      savedQueryState: undefined,
      savedVisConfig: undefined,
    });

    renderPage();

    await waitFor(() => {
      expect(mockContainer.executeAll).toHaveBeenCalled();
    });
  });

  it('does not execute query for new explore with empty query', async () => {
    mockQueryBuilder.queryState$.getValue.mockReturnValue({ query: '' });
    (useInitialSaveExplore as jest.Mock).mockReturnValue({
      savedExplore: { id: undefined },
      isLoading: false,
      error: undefined,
      savedQueryState: undefined,
      savedVisConfig: undefined,
    });

    renderPage();

    await waitFor(() => {
      expect(mockContainer.load).toHaveBeenCalled();
    });
    expect(mockContainer.executeAll).not.toHaveBeenCalled();
  });

  // The page no longer resets the query builder: MultiQueryBuilderProvider disposes it.
  it('resets the visualizationBuilder, not the query builder, on unmount', async () => {
    (useInitialSaveExplore as jest.Mock).mockReturnValue({
      savedExplore: { id: '1', title: 'My Explore' },
      isLoading: false,
      error: undefined,
      savedQueryState: undefined,
      savedVisConfig: undefined,
    });

    const { unmount } = renderPage();
    await waitFor(() => expect(mockContainer.load).toHaveBeenCalled());

    unmount();

    expect(mockContainer.reset).not.toHaveBeenCalled();
    expect(mockVisualizationBuilder.reset).toHaveBeenCalled();
  });
});
