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
import React from 'react';
import { DataView as Dataset } from 'src/plugins/data/common';
import { TopNavMenuIconRun, TopNavMenuIconUIData } from '../types';
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

export const saveTopNavData: TopNavMenuIconUIData = {
  tooltip: i18n.translate('agentTraces.topNav.saveTitle', {
    defaultMessage: 'Save',
  }),
  ariaLabel: i18n.translate('agentTraces.topNav.saveAriaLabel', {
    defaultMessage: `Save search`,
  }),
  testId: 'discoverSaveButton',
  iconType: 'save',
  controlType: 'icon',
};

export interface SaveStateProps {
  dataset: Dataset | undefined;
  tabState: TabState;
  flavorId: string | null;
  tabDefinition: TabDefinition | undefined;
  activeTabId: string;
}

export const getSaveButtonRun = (
  services: AgentTracesServices,
  startSyncingQueryStateWithUrl: () => void,
  searchContext: ExecutionContextSearch,
  saveStateProps: SaveStateProps,
  savedAgentTraces?: SavedAgentTraces
): TopNavMenuIconRun => () => {
  if (!savedAgentTraces) return;

  const onSave = async ({
    newTitle,
    newCopyOnSave,
    isTitleDuplicateConfirmed,
    onTitleDuplicate,
  }: OnSaveProps): Promise<SaveResult | undefined> => {
    const savedAgentTracesWithState = saveStateToSavedObject(
      savedAgentTraces,
      saveStateProps.flavorId ?? 'logs',
      saveStateProps.tabDefinition!,
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
