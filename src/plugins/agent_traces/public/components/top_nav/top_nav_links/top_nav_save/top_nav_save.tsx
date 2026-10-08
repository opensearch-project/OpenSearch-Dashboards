/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TODO:
 * - make this file work correctly with the new saved agent traces
 * - write unit tests
 */

import { i18n } from '@osd/i18n';

import { DataView as Dataset } from 'src/plugins/data/common';
import { TopNavMenuButtonUIData, TopNavMenuIconRun } from '../types';
import { AgentTracesServices } from '../../../../types';
import { ExecutionContextSearch } from '../../../../../../expressions';
import { SavedAgentTraces } from '../../../../types/saved_agent_traces_types';
import {
  OnSaveProps,
  SavedObjectSaveModal,
  SaveResult,
  showSaveModal,
} from '../../../../../../saved_objects/public';
import { saveSavedAgentTraces } from '../../../../helpers/save_agent_traces';
import { TabState } from '../../../../application/utils/state_management/slices';
import { TabDefinition } from '../../../../services/tab_registry/tab_registry_service';
import { saveStateToSavedObject } from '../../../../saved_agent_traces/transforms';

// One label for both the tooltip and the aria-label: "Save" alone was too easily confused with
// the query panel's "Save query" control, which persists something different.
const saveSearchLabel = i18n.translate('agentTraces.topNav.saveAriaLabel', {
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
    services: AgentTracesServices,
    startSyncingQueryStateWithUrl: () => void,
    searchContext: ExecutionContextSearch,
    saveStateProps: SaveStateProps,
    savedAgentTraces?: SavedAgentTraces
  ): TopNavMenuIconRun =>
  () => {
    if (!savedAgentTraces) return;

    const onSave = async ({
      newTitle,
      newCopyOnSave,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    }: OnSaveProps): Promise<SaveResult | undefined> => {
      const savedAgentTracesWithState = saveStateToSavedObject(
        savedAgentTraces,
        saveStateProps.tabDefinition!,
        saveStateProps.flavorId ?? 'logs',
        {},
        saveStateProps.dataset,
        saveStateProps.activeTabId
      );
      const result = await saveSavedAgentTraces({
        savedAgentTraces: savedAgentTracesWithState,
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
        title={savedAgentTraces.title ?? ''}
        showCopyOnSave={!!savedAgentTraces.id}
        // TODO: Does this need to be type "agentTraces"?
        objectType="discover"
        description={i18n.translate('agentTraces.localMenu.saveSaveSearchDescription', {
          defaultMessage:
            'Save your Discover search so you can use it in visualizations and dashboards',
        })}
        showDescription={false}
      />
    );
    showSaveModal(saveModal, services.core.i18n.Context);
  };
