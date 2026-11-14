/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TODO:
 * - make this file work correctly with the new saved explore
 * - write unit tests
 */

import { i18n } from '@osd/i18n';
import { EuiSpacer } from '@elastic/eui';

import { DataView as Dataset } from 'src/plugins/data/common';
import { TopNavMenuButtonUIData, TopNavMenuIconRun } from '../types';
import { ExploreServices } from '../../../../types';
import { ExecutionContextSearch } from '../../../../../../expressions';
import { SavedExplore } from '../../../../types/saved_explore_types';
import {
  OnSaveProps,
  SavedObjectSaveModal,
  SaveResult,
  showSaveModal,
} from '../../../../../../saved_objects/public';
import { saveSavedExplore } from '../../../../helpers/save_explore';
import { ComplexQueryWarningCallout } from '../../../../helpers/complex_query_warning';
import { defaultPrepareQueryString } from '../../../../application/utils/state_management/actions/query_actions';
import { TabState } from '../../../../application/utils/state_management/slices';
import { TabDefinition } from '../../../../services/tab_registry/tab_registry_service';
import { saveStateToSavedObject } from '../../../../saved_explore/transforms';
import { getVisualizationBuilder } from '../../../visualizations/visualization_builder';
import { getUnrunQueryEdit, UnrunQueryEditCallout } from '../../../../helpers/unrun_query_edit';
import { prepareQueryForLanguage } from '../../../../application/utils/languages';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { Query } from '../../../../../../data/common';
import { datasetRequiresExplicitRun } from '../../../../application/utils/requires_explicit_run';

// One label for both the tooltip and the aria-label: "Save" alone was too easily confused with
// the query panel's "Save query" control, which persists something different.
const saveSearchLabel = i18n.translate('explore.topNav.saveAriaLabel', {
  defaultMessage: 'Save search',
});

// Save is the primary action, so it renders as a labeled button showing "Save search" at wide
// widths; the header's narrow breakpoint (_index.scss) hides the label so it collapses to icon-only
// like the other actions. tooltip stays for the collapsed state; aria-label is the name in both.
export const saveTopNavData: TopNavMenuButtonUIData = {
  label: saveSearchLabel,
  tooltip: saveSearchLabel,
  ariaLabel: saveSearchLabel,
  testId: 'discoverSaveButton',
  iconType: 'save',
  controlType: 'button',
};

export interface SaveStateProps {
  dataset: Dataset | undefined;
  tabState: TabState;
  flavorId: string | null;
  tabDefinition: TabDefinition | undefined;
  activeTabId: string;
  /** The query editor's text, or undefined when the editor isn't mounted (e.g. the visual builder). */
  getEditorText?: () => string | undefined;
}

// The query as it ran, for a language that rewrites it (PPL gets its source clause).
const preparedQueryOf = (query: Query | undefined): string | undefined => {
  if (!query) return undefined;
  try {
    return prepareQueryForLanguage(query).query;
  } catch {
    return typeof query.query === 'string' ? query.query : undefined;
  }
};

// The search context with the query state's query, prepared as it runs (PPL gets its source).
// The query the saved search holds, as its saved object stores it (use_page_initialization reads
// it the same way): a loaded saved search keeps it in kibanaSavedObjectMeta, not in
// searchSourceFields, which the save fills in.
const storedQueryOf = (savedExplore: SavedExplore): Query | undefined => {
  try {
    const json = savedExplore.kibanaSavedObjectMeta?.searchSourceJSON;
    return json ? (JSON.parse(json).query as Query | undefined) : undefined;
  } catch {
    return undefined;
  }
};

// Whether saving `query` would change the query the saved search holds (text, language or dataset).
const changesStoredQuery = (savedExplore: SavedExplore, query: Query | undefined): boolean => {
  const stored = storedQueryOf(savedExplore);
  return (
    String(stored?.query ?? '').trim() !== String(query?.query ?? '').trim() ||
    stored?.language !== query?.language ||
    stored?.dataset?.id !== query?.dataset?.id
  );
};

// The search context is the query string's, which can hold an unrun draft, so its query is never
// what is saved: the query state's is, prepared when it can be.
const getSearchContextToSave = (
  searchContext: ExecutionContextSearch,
  query: Query | undefined
): ExecutionContextSearch => {
  if (!query) return searchContext;
  try {
    return {
      ...searchContext,
      query: { ...(searchContext.query as Query), ...prepareQueryForLanguage(query) },
    };
  } catch {
    return { ...searchContext, query: { ...(searchContext.query as Query), ...query } };
  }
};

export const getSaveButtonRun =
  (
    services: ExploreServices,
    startSyncingQueryStateWithUrl: () => void,
    searchContext: ExecutionContextSearch,
    saveStateProps: SaveStateProps,
    savedExplore?: SavedExplore
  ): TopNavMenuIconRun =>
  () => {
    if (!savedExplore) return;

    // Whether the query being saved was flagged complex by query profiling (see
    // results.profile.isComplex), used to decide whether to show the warning banner in the save modal.
    // Guarded so the save flow never breaks if the store or query state is unavailable.
    const rootState = services.store?.getState();
    const query = rootState?.query;
    const prepareQuery =
      services.tabRegistry?.getTab(saveStateProps.activeTabId)?.prepareQuery ||
      defaultPrepareQueryString;
    const isQueryComplex =
      rootState && query?.language
        ? (rootState.results[prepareQuery(query)]?.profile?.isComplex ?? false)
        : false;

    // The search stores the query that last ran (the query state), not the editor's text, so the
    // results it shows are those of the saved query. The draft is what Run would run: the editor's
    // text, or the query string's draft when no editor is mounted (the visual builder, the Metrics
    // rows). In prompt mode the editor holds a prompt, not a query.
    const isPromptMode = rootState?.queryEditor?.editorMode === EditorMode.Prompt;
    const editorText = isPromptMode ? undefined : saveStateProps.getEditorText?.();
    const queryStringDraft = services.data?.query?.queryString?.getQuery?.()?.query;
    const draft =
      editorText ??
      (isPromptMode || typeof queryStringDraft !== 'string' ? undefined : queryStringDraft);
    // With no editor mounted the draft is the query string's, which a run writes in its prepared
    // form (query_sync_middleware), so the query that ran is compared in that form too. Otherwise
    // an unedited builder query would read as an unrun edit.
    //
    const lastRunQuery = editorText === undefined ? preparedQueryOf(query) : query?.query;
    // Only for a dataset that needs an explicit Run: other sources save as they always have.
    const explicitRun = datasetRequiresExplicitRun(
      services.data?.query?.queryString,
      query?.dataset
    );
    const unrunQueryEdit =
      explicitRun && query ? getUnrunQueryEdit(lastRunQuery, draft) : undefined;
    const searchContextToSave = explicitRun
      ? getSearchContextToSave(searchContext, query)
      : searchContext;

    const onSave = async ({
      newTitle,
      newCopyOnSave,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    }: OnSaveProps): Promise<SaveResult | undefined> => {
      // A source switch sets the query state to the new source's empty query and clears the
      // statuses; a refined selection sets it to the editor's draft and keeps the previous results,
      // marked stale (requires_explicit_run). Neither ran, so neither may replace the query an
      // existing search holds. Read at save time, so a Run while the dialog is open counts. A save
      // that leaves the stored query as it is (e.g. a chart change on a search just opened, which
      // an explicit-Run source doesn't run) is fine, and so is a copy, which replaces nothing.
      const editorState = services.store?.getState()?.queryEditor;
      const hasRun =
        !!Object.keys(editorState?.queryStatusMap ?? {}).length && !editorState?.isSelectionStale;
      if (
        (explicitRun ||
          datasetRequiresExplicitRun(
            services.data?.query?.queryString,
            storedQueryOf(savedExplore)?.dataset
          )) &&
        !hasRun &&
        !!savedExplore.id &&
        !newCopyOnSave &&
        changesStoredQuery(savedExplore, searchContextToSave.query as Query | undefined)
      ) {
        services.notifications?.toasts.addWarning({
          title: i18n.translate('explore.localMenu.saveSearch.notRunTitle', {
            defaultMessage: 'Not saved: the query has not been run',
          }),
          text: i18n.translate('explore.localMenu.saveSearch.notRunText', {
            defaultMessage:
              'The search keeps the query that ran, and nothing has run since the dataset or the language changed. Run the query, then save again.',
          }),
          'data-test-subj': 'saveSearchNotRunWarning',
        });
        // An empty SaveResult keeps the modal open, as a taken title does (showSaveModal).
        return {};
      }
      const visualizationBuilder = getVisualizationBuilder();
      const transformationService = visualizationBuilder.getTransformationService();
      const serializedPipeline = transformationService.serializePipeline();
      const visConfig = visualizationBuilder.visConfig$.value;
      const axesMapping = visConfig?.axesMapping;
      const savedExploreWithState = saveStateToSavedObject(
        savedExplore,
        saveStateProps.flavorId ?? 'logs',
        saveStateProps.tabDefinition,
        {
          axesMapping,
          chartType: visConfig?.type,
          styleOptions: visConfig?.styles,
          splitField: visConfig?.splitField,
          splitLayout: visConfig?.splitLayout,
          showSplitLabel: visConfig?.showSplitLabel,
          serializedPipeline,
        },
        saveStateProps.dataset,
        saveStateProps.activeTabId
      );
      const result = await saveSavedExplore({
        savedExplore: savedExploreWithState,
        newTitle,
        saveOptions: { isTitleDuplicateConfirmed, onTitleDuplicate },
        searchContext: searchContextToSave,
        services,
        startSyncingQueryStateWithUrl,
        openAfterSave: true,
        newCopyOnSave,
      });

      return result;
    };
    const saveModal = (
      <SavedObjectSaveModal
        onSave={onSave}
        onClose={() => {}}
        title={savedExplore.title ?? ''}
        showCopyOnSave={!!savedExplore.id}
        // TODO: Does this need to be type "explore"?
        objectType="discover"
        // Say that unrun edits aren't saved, and show the complex-query warning for a complex query.
        options={
          unrunQueryEdit || isQueryComplex ? (
            <>
              {unrunQueryEdit && (
                <UnrunQueryEditCallout edit={unrunQueryEdit} objectType="search" />
              )}
              {unrunQueryEdit && isQueryComplex && <EuiSpacer size="s" />}
              {isQueryComplex && <ComplexQueryWarningCallout />}
            </>
          ) : undefined
        }
        description={i18n.translate('explore.localMenu.saveSaveSearchDescription', {
          defaultMessage:
            'Save your Discover search so you can use it in visualizations and dashboards',
        })}
        showDescription={false}
      />
    );
    showSaveModal(saveModal, services.core.i18n.Context);
  };
