/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { getSaveButtonRun, saveTopNavData } from './top_nav_save';
import { ExploreServices } from '../../../../types';
import { ExecutionContextSearch } from '../../../../../../expressions';
import { SavedExplore } from '../../../../types/saved_explore_types';

// Mock dependencies
jest.mock('../../../../helpers/save_explore', () => ({
  saveSavedExplore: jest.fn(() => Promise.resolve({ id: 'saved-id' })),
}));

jest.mock('../../../../saved_explore/transforms', () => ({
  saveStateToSavedObject: jest.fn((obj) => obj),
}));

jest.mock('../../../../../../saved_objects/public', () => ({
  showSaveModal: jest.fn(),
  SavedObjectSaveModal: () => null,
}));

jest.mock('../../../visualizations/visualization_builder', () => ({
  getVisualizationBuilder: () => ({
    getTransformationService: () => ({ serializePipeline: () => undefined }),
    visConfig$: { value: undefined },
  }),
}));

const mockServices = {
  core: {
    i18n: {
      Context: React.Fragment,
    },
  },
} as unknown as ExploreServices;

const mockSearchContext: ExecutionContextSearch = {
  query: { query: 'test', language: 'PPL' },
  filters: [],
  timeRange: { from: 'now-15m', to: 'now' },
};

const mockSaveStateProps = {
  dataset: undefined,
  tabState: {
    logs: {},
    patterns: {
      patternsField: undefined,
      usingRegexPatterns: false,
    },
  },
  flavorId: 'logs',
  tabDefinition: {
    id: 'logs',
    name: 'Logs',
    label: 'Logs',
    flavor: 'logs' as any,
    supportedLanguages: ['PPL'],
    component: {} as any,
  },
  activeTabId: 'logs',
};

const mockSavedExplore = {
  id: 'test-id',
  title: 'Test Explore',
  type: 'logs',
  searchSource: {} as any,
  destroy: jest.fn(),
  save: jest.fn(),
  copyOnSave: false,
  lastSavedTitle: '',
  getEsType: jest.fn(),
  isSaved: jest.fn(() => true),
  getFullPath: jest.fn(),
  getOpenSearchType: jest.fn(),
} as unknown as SavedExplore;

describe('top_nav_save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTopNavData', () => {
    it('has correct configuration', () => {
      expect(saveTopNavData.tooltip).toBe('Save search');
      // Tooltip and aria-label are deliberately the same string.
      expect(saveTopNavData.ariaLabel).toBe(saveTopNavData.tooltip);
      expect(saveTopNavData.testId).toBe('discoverSaveButton');
      expect(saveTopNavData.iconType).toBe('save');
      // Labeled button (shows "Save search" at wide widths); the label collapses via CSS at narrow.
      expect(saveTopNavData.controlType).toBe('button');
      expect(saveTopNavData.label).toBe('Save search');
    });
  });

  describe('getSaveButtonRun', () => {
    it('returns early when no savedExplore is provided', () => {
      const run = getSaveButtonRun(mockServices, jest.fn(), mockSearchContext, mockSaveStateProps);

      // Should not throw and should complete quickly
      const mockElement = document.createElement('button');
      const result = run(mockElement);
      expect(result).toBeUndefined();
    });

    it('calls showSaveModal when savedExplore is provided', () => {
      const { showSaveModal } = jest.requireMock('../../../../../../saved_objects/public');

      const run = getSaveButtonRun(
        mockServices,
        jest.fn(),
        mockSearchContext,
        mockSaveStateProps,
        mockSavedExplore
      );

      const mockElement = document.createElement('button');
      run(mockElement);

      expect(showSaveModal).toHaveBeenCalled();
    });
  });

  describe('unrun query edits', () => {
    const DATASET = { id: 'logs', title: 'logs', type: 'INDEX_PATTERN' };
    const LAST_RUN = 'source = logs | head 3';
    // As it runs and is saved: PPL quotes an index pattern's name.
    const LAST_RUN_PREPARED = 'source = `logs` | head 3';

    const servicesWith = ({
      editorMode = 'query',
      queryStringQuery = LAST_RUN,
      // A query has run on the state on screen (one status entry), as after a Run.
      hasRun = true,
      // A refined selection keeps the previous results, marked stale, and sets the query state to
      // the editor's draft without running it.
      isSelectionStale = false,
    }: {
      editorMode?: string;
      queryStringQuery?: string;
      hasRun?: boolean;
      isSelectionStale?: boolean;
    } = {}) =>
      ({
        ...mockServices,
        notifications: { toasts: { addWarning: jest.fn() } },
        store: {
          getState: () => ({
            query: { query: LAST_RUN, language: 'PPL', dataset: DATASET },
            queryEditor: {
              editorMode,
              isSelectionStale,
              queryStatusMap: hasRun ? { [LAST_RUN]: { status: 'READY' } } : {},
            },
            results: {},
          }),
        },
        data: {
          query: {
            queryString: {
              getQuery: () => ({ query: queryStringQuery, language: 'PPL', dataset: DATASET }),
            },
          },
        },
      }) as unknown as ExploreServices;

    const openSaveModal = (
      services: ExploreServices,
      getEditorText?: () => string | undefined,
      savedExplore: typeof mockSavedExplore = mockSavedExplore
    ) => {
      const { showSaveModal } = jest.requireMock('../../../../../../saved_objects/public');
      const run = getSaveButtonRun(
        services,
        jest.fn(),
        { ...mockSearchContext, query: { query: LAST_RUN, language: 'PPL' } },
        { ...mockSaveStateProps, getEditorText },
        savedExplore
      );
      run(document.createElement('button'));
      return showSaveModal.mock.calls[0][0].props;
    };

    const renderOptions = (options: React.ReactNode) => render(<>{options}</>);

    it('says nothing when the editor holds the query that last ran', () => {
      const props = openSaveModal(servicesWith(), () => `${LAST_RUN}\n`);
      renderOptions(props.options);
      expect(screen.queryByTestId('unrunQueryEditCallout')).toBeNull();
    });

    it('says that unrun edits are not saved, with both queries, and saves the last-run query', async () => {
      const { saveSavedExplore } = jest.requireMock('../../../../helpers/save_explore');
      const props = openSaveModal(servicesWith(), () => 'source = logs | head 4');
      renderOptions(props.options);

      expect(screen.getByTestId('unrunQueryEditCallout')).toBeInTheDocument();
      expect(screen.getByTestId('unrunQueryEditSavedQuery')).toHaveTextContent(LAST_RUN);
      expect(screen.getByTestId('unrunQueryEditEditorQuery')).toHaveTextContent(
        'source = logs | head 4'
      );

      await props.onSave({
        newTitle: 'Saved',
        newCopyOnSave: false,
        isTitleDuplicateConfirmed: false,
        onTitleDuplicate: jest.fn(),
      });
      expect(saveSavedExplore).toHaveBeenCalledWith(
        expect.objectContaining({
          searchContext: expect.objectContaining({
            query: expect.objectContaining({
              query: LAST_RUN_PREPARED,
              language: 'PPL',
              dataset: DATASET,
            }),
          }),
        })
      );
    });

    it('saves the last-run query, not an unrun draft of the visual builder (no editor mounted)', async () => {
      const { saveSavedExplore } = jest.requireMock('../../../../helpers/save_explore');
      const props = openSaveModal(
        servicesWith({ queryStringQuery: 'source = logs | where a = 1' }),
        () => undefined
      );
      renderOptions(props.options);
      expect(screen.getByTestId('unrunQueryEditEditorQuery')).toHaveTextContent(
        'source = logs | where a = 1'
      );

      await props.onSave({
        newTitle: 'Saved',
        isTitleDuplicateConfirmed: false,
        onTitleDuplicate: jest.fn(),
      });
      expect(saveSavedExplore.mock.calls[0][0].searchContext.query.query).toBe(LAST_RUN_PREPARED);
    });

    // A run writes the prepared query into the query string, so with no editor mounted (the visual
    // builder, the Metrics rows) an unedited query must not read as an unrun edit.
    it('says nothing with no editor mounted when the query string holds the query that ran', () => {
      const props = openSaveModal(
        servicesWith({ queryStringQuery: LAST_RUN_PREPARED }),
        () => undefined
      );
      renderOptions(props.options);
      expect(screen.queryByTestId('unrunQueryEditCallout')).toBeNull();
    });

    it('refuses to save over an existing search when nothing on screen has run', async () => {
      const { saveSavedExplore } = jest.requireMock('../../../../helpers/save_explore');
      const services = servicesWith({ hasRun: false, queryStringQuery: '' });
      const props = openSaveModal(services, () => '');

      await props.onSave({
        newTitle: 'Saved',
        newCopyOnSave: false,
        isTitleDuplicateConfirmed: false,
        onTitleDuplicate: jest.fn(),
      });
      expect(saveSavedExplore).not.toHaveBeenCalled();
      expect(services.notifications.toasts.addWarning).toHaveBeenCalledWith(
        expect.objectContaining({ 'data-test-subj': 'saveSearchNotRunWarning' })
      );

      // A copy replaces nothing, so it is saved.
      await props.onSave({
        newTitle: 'Copy',
        newCopyOnSave: true,
        isTitleDuplicateConfirmed: false,
        onTitleDuplicate: jest.fn(),
      });
      expect(saveSavedExplore).toHaveBeenCalled();
    });

    // A refined selection (other log groups) sets the query state to the editor's draft without
    // running it, and keeps the previous results as stale.
    it('refuses to save over an existing search on a stale selection, whatever the editor holds', async () => {
      const { saveSavedExplore } = jest.requireMock('../../../../helpers/save_explore');
      const services = servicesWith({ isSelectionStale: true });
      const props = openSaveModal(services, () => LAST_RUN);

      await props.onSave({
        newTitle: 'Saved',
        newCopyOnSave: false,
        isTitleDuplicateConfirmed: false,
        onTitleDuplicate: jest.fn(),
      });
      expect(saveSavedExplore).not.toHaveBeenCalled();
      expect(services.notifications.toasts.addWarning).toHaveBeenCalledWith(
        expect.objectContaining({ 'data-test-subj': 'saveSearchNotRunWarning' })
      );
    });

    // An explicit-Run source opens a saved search without running it, so nothing has run, yet the
    // query state is the query the search stores: a save that only changes the chart or the title
    // must go through.
    it('saves an unrun search whose query is the one it already stores', async () => {
      const { saveSavedExplore } = jest.requireMock('../../../../helpers/save_explore');
      const services = servicesWith({ hasRun: false });
      const stored = {
        ...mockSavedExplore,
        // A loaded saved search keeps its query in its saved object's searchSourceJSON.
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({
            query: { query: LAST_RUN_PREPARED, language: 'PPL', dataset: DATASET },
          }),
        },
      } as any;
      const props = openSaveModal(services, () => LAST_RUN, stored);

      await props.onSave({
        newTitle: 'Renamed',
        newCopyOnSave: false,
        isTitleDuplicateConfirmed: false,
        onTitleDuplicate: jest.fn(),
      });
      expect(services.notifications.toasts.addWarning).not.toHaveBeenCalled();
      expect(saveSavedExplore).toHaveBeenCalled();
    });

    it('says nothing in prompt mode, where the editor holds a prompt', () => {
      const props = openSaveModal(servicesWith({ editorMode: 'prompt' }), () => 'show me errors');
      renderOptions(props.options);
      expect(screen.queryByTestId('unrunQueryEditCallout')).toBeNull();
    });
  });
});
