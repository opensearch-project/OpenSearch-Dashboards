/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveVisButton } from './save_vis_button';
import { BehaviorSubject } from 'rxjs';
import { EditorMode } from '../../utils/state_management/types';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';
import { useCurrentExploreId } from '../../../application/utils/hooks/use_current_explore_id';
import { useSavedExplore } from '../../utils/hooks/use_saved_explore';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ChartConfig } from '../../../components/visualizations/visualization_builder.types';

// Panel-level query options read when saving.
// const mockContainer = { multiQueryEditorState$: new BehaviorSubject({ maxDataPoints: undefined }) };
// Two rows, the first hidden: `queries` keeps both, searchSourceJSON the first visible one.
const mockSavedContainerState = {
  queries: [
    ['A', { query: 'source=hidden', language: 'PPL' }],
    // The container puts the panel's max data points on each metrics row.
    ['B', { query: 'up', language: 'PROMQL', queryOptions: { step: '30s', maxDataPoints: 500 } }],
  ],
  editorState: {
    rows: [
      ['A', { isHidden: true }],
      ['B', { isHidden: false }],
    ],
  },
};
const mockRowDataView = { id: 'row-b-dataview' };
const mockContainer = {
  multiQueryEditorState$: new BehaviorSubject({ maxDataPoints: undefined }),
  getContainerState: jest.fn(() => mockSavedContainerState),
  // The first visible row's dataset backs searchSourceJSON's index.
  getRow: jest.fn((refId: string) =>
    refId === 'B' ? { datasetView$: new BehaviorSubject({ dataView: mockRowDataView }) } : undefined
  ),
};

// const mockCommitSaved = jest.fn();
// const mockBeginSave = jest.fn(() => mockCommitSaved);
// useEditorDirty's confirmSave takes the new baseline; the button calls it once saved.
const mockConfirmSave = jest.fn();
const mockBeginSave = mockConfirmSave;
const mockUseEditorDirty = jest.fn(() => ({ isDirty: false, confirmSave: mockBeginSave }));
jest.mock('../hooks/use_editor_dirty', () => ({ useEditorDirty: () => mockUseEditorDirty() }));

jest.mock('../hooks/use_query_builder_state', () => ({
  useQueryBuilderState: jest.fn(),
}));
jest.mock('../hooks/use_visualization_builder', () => ({ useVisualizationBuilder: jest.fn() }));
jest.mock('../../../application/utils/hooks/use_current_explore_id', () => ({
  useCurrentExploreId: jest.fn(),
}));
jest.mock('../../utils/hooks/use_saved_explore', () => ({ useSavedExplore: jest.fn() }));
jest.mock('../../../components/query_panel/utils/use_search_context', () => ({
  useSearchContext: jest.fn().mockReturnValue({ query: {}, filters: [] }),
}));
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: (component: any) => component,
  toMountPoint: jest.fn(),
}));
jest.mock('./save_vis_modal', () => ({
  SaveVisModal: ({ onConfirm }: any) => (
    <button
      data-test-subj="save-vis-modal"
      onClick={() =>
        onConfirm({
          savedExplore: {
            title: '',
            save: jest.fn().mockResolvedValue('new-explore'),
          },
          newTitle: 'New Explore',
          isTitleDuplicateConfirmed: false,
          onTitleDuplicate: jest.fn(),
        })
      }
    >
      Modal
    </button>
  ),
}));

jest.mock('../../../components/data_transformations', () => {
  const mockObs = {
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    getValue: jest.fn().mockReturnValue([]),
  };
  const mockMapObs = {
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    getValue: jest.fn().mockReturnValue(new Map()),
  };
  return {
    useTransformationService: jest.fn().mockReturnValue({
      clearPipeline: jest.fn(),
      pipeline$: mockObs,
      getPipeline$: () => mockObs,
      stageFields$: mockMapObs,
    }),
    TransformPanel: () => null,
  };
});

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options.defaultMessage),
  },
}));
const mockNavigateToWithEmbeddablePackage = jest.fn();
const mockAddSuccess = jest.fn();
const mockAdd = jest.fn();
const mockDocTitleChange = jest.fn();
const mockSetBreadcrumbs = jest.fn();
const mockScopedHistoryPush = jest.fn();
const mockOsdUrlStateStorageGet = jest.fn().mockReturnValue(null);

const buildServices = () => ({
  toastNotifications: { addSuccess: mockAddSuccess, add: mockAdd },
  chrome: { docTitle: { change: mockDocTitleChange }, setBreadcrumbs: mockSetBreadcrumbs },
  embeddable: {
    getStateTransfer: jest.fn().mockReturnValue({
      navigateToWithEmbeddablePackage: mockNavigateToWithEmbeddablePackage,
    }),
  },
  osdUrlStateStorage: { get: mockOsdUrlStateStorageGet },
  scopedHistory: { push: mockScopedHistoryPush },
  // Saving reads the shared filters at save time.
  data: { query: { filterManager: { getFilters: jest.fn().mockReturnValue([]) } } },
});

// Saving reads the selected row's query state (no global query mirror).
const buildQueryBuilder = () => ({
  queryState$: new BehaviorSubject({ query: 'source=logs', language: 'PPL' }),
});

const mockSavedExplore = {
  id: 'explore-1',
  title: 'My Explore',
  visualization: '',
  save: jest.fn().mockResolvedValue('explore-1'),
};

const buildVisualizationBuilder = (
  visConfig: ChartConfig = {
    type: 'bar',
    styles: {},
    axesMapping: { x: 'field' },
  }
) => ({
  visualizationBuilderForEditor: {
    visConfig$: new BehaviorSubject(visConfig),
    getTransformationService: jest.fn().mockReturnValue({
      serializePipeline: jest.fn().mockReturnValue([]),
    }),
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseEditorDirty.mockReturnValue({ isDirty: false, confirmSave: mockBeginSave });
  (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: buildServices() });
  (useVisualizationBuilder as jest.Mock).mockReturnValue(buildVisualizationBuilder());
  (useQueryBuilderState as jest.Mock).mockReturnValue({
    queryEditorState: {
      editorMode: EditorMode.Query,
      lastExecutedTranslatedQuery: undefined,
    },
    datasetView: { dataView: undefined },
    queryBuilder: buildQueryBuilder(),
    container: mockContainer,
  });
  (useCurrentExploreId as jest.Mock).mockReturnValue(undefined);
  (useSavedExplore as jest.Mock).mockReturnValue({ savedExplore: { id: undefined } });
});

describe('SaveVisButton', () => {
  it('renders save and discard buttons', () => {
    render(<SaveVisButton />);
    expect(screen.getByTestId('saveVisualizationEditorButton')).toBeInTheDocument();
    expect(screen.getByTestId('discardVisualizationEditorButton')).toBeInTheDocument();
  });

  it('shows "Save" label when no originatingApp', () => {
    render(<SaveVisButton />);
    expect(screen.getByTestId('saveVisualizationEditorButton')).toHaveTextContent('Save');
  });

  it('shows "Save and back" label when originatingApp is set', () => {
    mockOsdUrlStateStorageGet.mockReturnValue({ originatingApp: 'dashboard' });
    render(<SaveVisButton />);
    expect(screen.getByTestId('saveVisualizationEditorButton')).toHaveTextContent('Save and back');
  });

  it('opens SaveVisModal when save is clicked for new explore', async () => {
    render(<SaveVisButton />);
    fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));
    // The click handler is async (slow-query save warning is awaited first), so
    // the modal opens on the next tick.
    expect(await screen.findByTestId('save-vis-modal')).toBeInTheDocument();
  });

  it('preserves container info when saving a new explore from a dashboard', async () => {
    const containerInfo = {
      containerName: 'Dashboard',
      containerId: 'dashboard-1',
      containerData: { sectionId: 'section-1' },
    };
    mockOsdUrlStateStorageGet.mockReturnValue({
      originatingApp: 'dashboards',
      containerInfo,
    });

    render(<SaveVisButton />);
    fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));
    fireEvent.click(await screen.findByTestId('save-vis-modal'));

    await waitFor(() => {
      expect(mockNavigateToWithEmbeddablePackage).toHaveBeenCalledWith('dashboards', {
        state: {
          type: 'explore',
          input: { savedObjectId: 'new-explore' },
          containerInfo,
        },
      });
    });
  });

  it('saves directly without modal for existing explore when not dirty', async () => {
    (useCurrentExploreId as jest.Mock).mockReturnValue('explore-1');
    (useSavedExplore as jest.Mock).mockReturnValue({ savedExplore: mockSavedExplore });

    render(<SaveVisButton />);
    fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

    await waitFor(() => {
      expect(screen.queryByTestId('save-vis-modal')).not.toBeInTheDocument();
      expect(mockAddSuccess).toHaveBeenCalled();
    });
  });

  it('serializes panel settings when saving an existing visualization', async () => {
    const savedExplore = {
      ...mockSavedExplore,
      save: jest.fn().mockResolvedValue('explore-1'),
    };
    (useCurrentExploreId as jest.Mock).mockReturnValue('explore-1');
    (useSavedExplore as jest.Mock).mockReturnValue({ savedExplore });
    mockUseEditorDirty.mockReturnValue({ isDirty: true, confirmSave: mockBeginSave });
    (useVisualizationBuilder as jest.Mock).mockReturnValue(
      buildVisualizationBuilder({
        type: 'bar',
        styles: {},
        axesMapping: { x: 'field' },
        title: 'Panel title',
        description: 'Panel description',
      })
    );
    (useQueryBuilderState as jest.Mock).mockReturnValue({
      queryEditorState: {
        editorMode: EditorMode.Query,
        lastExecutedTranslatedQuery: undefined,
      },
      datasetView: { dataView: undefined },
      queryBuilder: buildQueryBuilder(),
      container: mockContainer,
    });

    render(<SaveVisButton />);
    fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

    await waitFor(() => {
      expect(savedExplore.save).toHaveBeenCalled();
    });
    expect(JSON.parse(savedExplore.visualization)).toEqual(
      expect.objectContaining({
        title: 'Panel title',
        description: 'Panel description',
      })
    );
  });

  describe('saving every row', () => {
    const saveExisting = async () => {
      const savedExplore: Record<string, any> = {
        ...mockSavedExplore,
        save: jest.fn().mockResolvedValue('explore-1'),
      };
      (useCurrentExploreId as jest.Mock).mockReturnValue('explore-1');
      (useSavedExplore as jest.Mock).mockReturnValue({ savedExplore });
      mockUseEditorDirty.mockReturnValue({ isDirty: true, confirmSave: mockBeginSave });
      render(<SaveVisButton />);
      fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));
      await waitFor(() => expect(savedExplore.save).toHaveBeenCalled());
      return savedExplore;
    };

    it('saves every row in `queries`, each with its hidden state', async () => {
      const savedExplore = await saveExisting();
      expect(JSON.parse(savedExplore.queries)).toEqual([
        // { refId: 'A', query: { query: 'source=hidden', language: 'PPL', isHidden: true } },
        { refId: 'A', query: { query: 'source=hidden', language: 'PPL' }, isHidden: true },
        {
          refId: 'B',
          query: {
            query: 'up',
            language: 'PROMQL',
            queryOptions: { step: '30s', maxDataPoints: 500 },
          },
        },
      ]);
    });

    it("takes searchSourceJSON's index from the first visible row", async () => {
      const savedExplore = await saveExisting();
      expect(savedExplore.searchSourceFields.index).toBe(mockRowDataView);
    });

    it('keeps the first visible row in searchSourceJSON, with max data points', async () => {
      const savedExplore = await saveExisting();
      expect(savedExplore.searchSourceFields.query).toEqual({
        query: 'up',
        language: 'PROMQL',
        queryOptions: { step: '30s', maxDataPoints: 500 },
      });
    });

    // it('takes the snapshot when saving starts and commits it once saved', async () => {
    it('takes the new dirty-check baseline once saved', async () => {
      await saveExisting();
      // expect(mockBeginSave).toHaveBeenCalled();
      // expect(mockCommitSaved).toHaveBeenCalled();
      expect(mockConfirmSave).toHaveBeenCalledTimes(1);
    });
  });

  it('shows discard as a warning only when there are changes', () => {
    const { rerender } = render(<SaveVisButton />);
    const discard = () => screen.getByTestId('discardVisualizationEditorButton');
    expect(discard().className).not.toContain('danger');

    mockUseEditorDirty.mockReturnValue({ isDirty: true, confirmSave: mockBeginSave });
    rerender(<SaveVisButton />);
    expect(discard().className).toContain('danger');
  });

  it('discards and navigates to originatingApp when originatingApp is set', () => {
    mockOsdUrlStateStorageGet.mockReturnValue({ originatingApp: 'dashboard' });
    render(<SaveVisButton />);
    fireEvent.click(screen.getByTestId('discardVisualizationEditorButton'));
    expect(mockNavigateToWithEmbeddablePackage).toHaveBeenCalledWith('dashboard');
  });
});
