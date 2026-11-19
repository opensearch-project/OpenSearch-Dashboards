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
let mockSaveVisModalProps: any;
jest.mock('./save_vis_modal', () => ({
  SaveVisModal: (props: any) => {
    mockSaveVisModalProps = props;
    const { onConfirm } = props;
    return (
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
    );
  },
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
const mockAddWarning = jest.fn();
const mockDocTitleChange = jest.fn();
const mockSetBreadcrumbs = jest.fn();
const mockScopedHistoryPush = jest.fn();
const mockOsdUrlStateStorageGet = jest.fn().mockReturnValue(null);

const buildServices = () => ({
  toastNotifications: { addSuccess: mockAddSuccess, add: mockAdd, addWarning: mockAddWarning },
  chrome: { docTitle: { change: mockDocTitleChange }, setBreadcrumbs: mockSetBreadcrumbs },
  embeddable: {
    getStateTransfer: jest.fn().mockReturnValue({
      navigateToWithEmbeddablePackage: mockNavigateToWithEmbeddablePackage,
    }),
  },
  osdUrlStateStorage: { get: mockOsdUrlStateStorageGet },
  scopedHistory: { push: mockScopedHistoryPush },
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
    isVisDirty$: new BehaviorSubject(false),
    getTransformationService: jest.fn().mockReturnValue({
      serializePipeline: jest.fn().mockReturnValue([]),
    }),
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: buildServices() });
  (useVisualizationBuilder as jest.Mock).mockReturnValue(buildVisualizationBuilder());
  (useQueryBuilderState as jest.Mock).mockReturnValue({
    queryEditorState: {
      isQueryEditorDirty: false,
      editorMode: EditorMode.Query,
      lastExecutedTranslatedQuery: undefined,
    },
    datasetView: { dataView: undefined },
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
        isQueryEditorDirty: true,
        editorMode: EditorMode.Query,
        lastExecutedTranslatedQuery: undefined,
      },
      datasetView: { dataView: undefined },
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

  it('discards and navigates to originatingApp when originatingApp is set', () => {
    mockOsdUrlStateStorageGet.mockReturnValue({ originatingApp: 'dashboard' });
    render(<SaveVisButton />);
    fireEvent.click(screen.getByTestId('discardVisualizationEditorButton'));
    expect(mockNavigateToWithEmbeddablePackage).toHaveBeenCalledWith('dashboard');
  });

  describe('the query it saves', () => {
    const LAST_RUN = 'stats count(*) as n by bin(5m)';
    // MY_TYPE needs an explicit Run; INDEX_PATTERN (OpenSearch) doesn't.
    const EXPLICIT_RUN_DATASET = { id: 'set-a', type: 'MY_TYPE' };
    const OPENSEARCH_DATASET = { id: 'logs-a', type: 'INDEX_PATTERN' };

    beforeEach(() => {
      (useOpenSearchDashboards as jest.Mock).mockReturnValue({
        services: {
          ...buildServices(),
          data: {
            query: {
              queryString: {
                getDatasetService: () => ({
                  getType: (type: string) => ({
                    meta: { requiresExplicitRun: type === 'MY_TYPE' },
                  }),
                }),
              },
            },
          },
        },
      });
    });

    const withQuery = ({
      query,
      editorText,
      lastRun = LAST_RUN,
      dataset = EXPLICIT_RUN_DATASET,
      lastRunDataset = dataset,
    }: {
      query: string;
      editorText?: string;
      lastRun?: string;
      dataset?: { id: string; type: string };
      lastRunDataset?: { id: string; type: string };
    }) => {
      (useQueryBuilderState as jest.Mock).mockReturnValue({
        queryState: { query, language: 'my_language', dataset },
        queryEditorState: {
          isQueryEditorDirty: true,
          editorMode: EditorMode.Query,
          activeBottomPanelTab: 'QUERY_TAB',
          languageType: 'my_language',
        },
        datasetView: { dataView: undefined },
        queryBuilder: {
          getEditor: () => (editorText === undefined ? null : { getValue: () => editorText }),
          getLastRunQueryState: () => ({
            query: lastRun,
            language: 'my_language',
            dataset: lastRunDataset,
          }),
        },
      });
    };

    const existing = () => {
      const savedExplore = { ...mockSavedExplore, save: jest.fn().mockResolvedValue('explore-1') };
      (useCurrentExploreId as jest.Mock).mockReturnValue('explore-1');
      (useSavedExplore as jest.Mock).mockReturnValue({ savedExplore });
      return savedExplore;
    };

    it('saves an existing visualization right away when the editor holds the last-run query', async () => {
      const savedExplore = existing();
      withQuery({ query: LAST_RUN, editorText: LAST_RUN });

      render(<SaveVisButton />);
      fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

      await waitFor(() => expect(savedExplore.save).toHaveBeenCalled());
      expect(screen.queryByTestId('saveVisualizationUnrunEditConfirm')).toBeNull();
    });

    it('asks before saving the last-run query when the editor holds unrun edits', async () => {
      const savedExplore = existing();
      withQuery({ query: LAST_RUN, editorText: `${LAST_RUN} | filter status >= 500` });

      render(<SaveVisButton />);
      fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

      expect(await screen.findByTestId('saveVisualizationUnrunEditConfirm')).toBeInTheDocument();
      expect(screen.getByTestId('unrunQueryEditSavedQuery')).toHaveTextContent(LAST_RUN);
      expect(screen.getByTestId('unrunQueryEditEditorQuery')).toHaveTextContent(
        `${LAST_RUN} | filter status >= 500`
      );
      expect(savedExplore.save).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('confirmModalConfirmButton'));
      await waitFor(() => expect(savedExplore.save).toHaveBeenCalled());
    });

    // A dataset pick keeps the query, so the text alone can't show that the chart was drawn from
    // another dataset; saving the new one with the old axes can leave a panel that can't load.
    it('saves nothing when the dataset changed since the last run, and says so', async () => {
      const savedExplore = existing();
      withQuery({
        query: LAST_RUN,
        editorText: LAST_RUN,
        dataset: { id: 'set-b', type: 'MY_TYPE' },
        lastRunDataset: { id: 'set-a', type: 'MY_TYPE' },
      });

      render(<SaveVisButton />);
      fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

      await waitFor(() =>
        expect(mockAddWarning).toHaveBeenCalledWith(
          expect.objectContaining({ 'data-test-subj': 'saveVisualizationDatasetNotRunWarning' })
        )
      );
      expect(savedExplore.save).not.toHaveBeenCalled();
    });

    it('saves nothing when the user cancels', async () => {
      const savedExplore = existing();
      withQuery({ query: LAST_RUN, editorText: 'fields @message' });

      render(<SaveVisButton />);
      fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));
      fireEvent.click(await screen.findByTestId('confirmModalCancelButton'));

      expect(screen.queryByTestId('saveVisualizationUnrunEditConfirm')).toBeNull();
      expect(savedExplore.save).not.toHaveBeenCalled();
      expect(mockNavigateToWithEmbeddablePackage).not.toHaveBeenCalled();
    });

    it('never saves a query that a dataset or language change emptied, and says so', async () => {
      const savedExplore = existing();
      withQuery({ query: '', editorText: '' });

      render(<SaveVisButton />);
      fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

      await waitFor(() =>
        expect(mockAddWarning).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Not saved: the query is empty' })
        )
      );
      expect(savedExplore.save).not.toHaveBeenCalled();
      expect(mockNavigateToWithEmbeddablePackage).not.toHaveBeenCalled();
    });

    it('saves an empty query that is the one that ran (e.g. a PPL default query)', async () => {
      const savedExplore = existing();
      withQuery({ query: '', editorText: '', lastRun: '' });

      render(<SaveVisButton />);
      fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

      await waitFor(() => expect(savedExplore.save).toHaveBeenCalled());
      expect(mockAddWarning).not.toHaveBeenCalled();
    });

    it("tells the save dialog of a new visualization about the editor's unrun edits", async () => {
      withQuery({ query: LAST_RUN, editorText: 'fields @message' });

      render(<SaveVisButton />);
      fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

      await screen.findByTestId('save-vis-modal');
      expect(mockSaveVisModalProps.unrunQueryEdit).toEqual({
        savedQuery: LAST_RUN,
        editorQuery: 'fields @message',
      });
    });

    describe('on an OpenSearch dataset, as before', () => {
      const PPL = 'source = logs | stats count() by status';

      it('saves an existing visualization without asking about unrun edits', async () => {
        const savedExplore = existing();
        withQuery({
          query: PPL,
          editorText: `${PPL} | head 5`,
          lastRun: PPL,
          dataset: OPENSEARCH_DATASET,
        });

        render(<SaveVisButton />);
        fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

        await waitFor(() => expect(savedExplore.save).toHaveBeenCalled());
        expect(screen.queryByTestId('saveVisualizationUnrunEditConfirm')).toBeNull();
      });

      it('saves after a dataset change without a run', async () => {
        const savedExplore = existing();
        withQuery({
          query: PPL,
          editorText: PPL,
          lastRun: PPL,
          dataset: { id: 'logs-b', type: 'INDEX_PATTERN' },
          lastRunDataset: OPENSEARCH_DATASET,
        });

        render(<SaveVisButton />);
        fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

        await waitFor(() => expect(savedExplore.save).toHaveBeenCalled());
        expect(mockAddWarning).not.toHaveBeenCalled();
      });

      it('saves and goes back with a query that a dataset change emptied', async () => {
        mockOsdUrlStateStorageGet.mockReturnValue({ originatingApp: 'dashboards' });
        const savedExplore = existing();
        withQuery({ query: '', editorText: '', lastRun: PPL, dataset: OPENSEARCH_DATASET });

        render(<SaveVisButton />);
        expect(screen.getByTestId('saveVisualizationEditorButton')).toHaveTextContent(
          'Save and back'
        );
        fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

        await waitFor(() => expect(mockNavigateToWithEmbeddablePackage).toHaveBeenCalled());
        expect(savedExplore.save).toHaveBeenCalled();
        expect(mockAddWarning).not.toHaveBeenCalled();
      });

      it('does not tell the save dialog of a new visualization about unrun edits', async () => {
        withQuery({
          query: PPL,
          editorText: `${PPL} | head 5`,
          lastRun: PPL,
          dataset: OPENSEARCH_DATASET,
        });

        render(<SaveVisButton />);
        fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));

        await screen.findByTestId('save-vis-modal');
        expect(mockSaveVisModalProps.unrunQueryEdit).toBeUndefined();
      });
    });
  });
});
