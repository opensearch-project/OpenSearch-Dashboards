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
import { UrlTransformationState } from '../../../data_transformations';

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
}

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

    const onSave = async ({
      newTitle,
      newCopyOnSave,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    }: OnSaveProps): Promise<SaveResult | undefined> => {
      const visualizationBuilder = getVisualizationBuilder();
      const transformationService = visualizationBuilder.getTransformationService();
      const pipeline = transformationService.pipeline$.getValue();
      const serializedPipeline: UrlTransformationState[] = pipeline.map((instance) => ({
        definitionId: instance.definition_id,
        config: instance.config,
        hide: instance.hide,
      }));
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
        searchContext,
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
        // Show the complex-query warning banner inside the save modal for a complex query.
        options={isQueryComplex ? <ComplexQueryWarningCallout /> : undefined}
        description={i18n.translate('explore.localMenu.saveSaveSearchDescription', {
          defaultMessage:
            'Save your Discover search so you can use it in visualizations and dashboards',
        })}
        showDescription={false}
      />
    );
    showSaveModal(saveModal, services.core.i18n.Context);
  };
