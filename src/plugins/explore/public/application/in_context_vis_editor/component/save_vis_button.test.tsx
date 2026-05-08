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
import { useCurrentExploreId } from '../hooks/use_explore_id';
import { useSavedExplore } from '../../utils/hooks/use_saved_explore';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';

jest.mock('../hooks/use_query_builder_state', () => ({
  useQueryBuilderState: jest.fn(),
}));
jest.mock('../hooks/use_visualization_builder', () => ({ useVisualizationBuilder: jest.fn() }));
jest.mock('../hooks/use_explore_id', () => ({ useCurrentExploreId: jest.fn() }));
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
  SaveVisModal: () => <div data-test-subj="save-vis-modal">Modal</div>,
}));

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
});

const mockSavedExplore = {
  id: 'explore-1',
  title: 'My Explore',
  save: jest.fn().mockResolvedValue('explore-1'),
};

const buildVisualizationBuilder = () => ({
  visualizationBuilderForEditor: {
    visConfig$: { value: { type: 'bar', styles: {}, axesMapping: { x: 'field' } } },
    isVisDirty$: new BehaviorSubject(false),
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

  it('opens SaveVisModal when save is clicked for new explore', () => {
    render(<SaveVisButton />);
    fireEvent.click(screen.getByTestId('saveVisualizationEditorButton'));
    expect(screen.getByTestId('save-vis-modal')).toBeInTheDocument();
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

  it('saves directly without modal for existing explore when dirty', async () => {
    (useCurrentExploreId as jest.Mock).mockReturnValue('explore-1');
    (useSavedExplore as jest.Mock).mockReturnValue({ savedExplore: mockSavedExplore });
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
      expect(mockSavedExplore.save).toHaveBeenCalled();
    });
  });

  it('discards and navigates to originatingApp when originatingApp is set', () => {
    mockOsdUrlStateStorageGet.mockReturnValue({ originatingApp: 'dashboard' });
    render(<SaveVisButton />);
    fireEvent.click(screen.getByTestId('discardVisualizationEditorButton'));
    expect(mockNavigateToWithEmbeddablePackage).toHaveBeenCalledWith('dashboard');
  });

  it('saves and navigates to edit path when originatingApp is set', () => {
    mockOsdUrlStateStorageGet.mockReturnValue({ originatingApp: 'dashboard' });
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: mockReload },
      writable: true,
    });

    render(<SaveVisButton />);
    fireEvent.click(screen.getByTestId('discardVisualizationEditorButton'));
    expect(mockNavigateToWithEmbeddablePackage).toHaveBeenCalledWith('dashboard');
  });
});
