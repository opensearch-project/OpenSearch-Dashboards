/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { CoreStart } from 'src/core/public';
import { SavedAgentTraces } from '../saved_agent_traces';
import { AgentTracesServices } from '../types';
import { ExecutionContextSearch } from '../../../expressions/common';
import { getRootBreadcrumbs } from '../application/legacy/discover/application/helpers/breadcrumbs';
import { Query } from '../../../data/common';
import { SaveResult } from '../../../saved_objects/public';
import { LegacyState, setSavedSearch } from '../application/utils/state_management/slices';
import { updateLegacyPropertiesInSavedObject } from '../saved_agent_traces/transforms';

export async function saveSavedAgentTraces({
  savedAgentTraces,
  newTitle,
  saveOptions,
  searchContext,
  services,
  startSyncingQueryStateWithUrl,
  openAfterSave,
  newCopyOnSave,
}: {
  savedAgentTraces: SavedAgentTraces;
  newTitle: string;
  saveOptions: { isTitleDuplicateConfirmed: boolean; onTitleDuplicate: () => void };
  searchContext: ExecutionContextSearch;
  services: Partial<CoreStart> & AgentTracesServices;
  startSyncingQueryStateWithUrl: () => void;
  openAfterSave: boolean;
  newCopyOnSave?: boolean;
}): Promise<SaveResult | undefined> {
  const { toastNotifications, chrome, store } = services;

  const currentTitle = savedAgentTraces.title;
  savedAgentTraces.title = newTitle;
  if (newCopyOnSave !== undefined) {
    savedAgentTraces.copyOnSave = newCopyOnSave;
  }

  const state: LegacyState = store.getState().legacy; // store is defined before the view is loaded
  savedAgentTraces.columns = state.columns;
  savedAgentTraces.sort = state.sort;

  // Use transform approach similar to vis_builder - serialize state into saved object
  updateLegacyPropertiesInSavedObject(savedAgentTraces, {
    columns: state.columns,
    sort: state.sort,
  });

  const searchSourceInstance = savedAgentTraces.searchSourceFields;

  if (searchSourceInstance) {
    searchSourceInstance.query = searchContext.query as Query;
    searchSourceInstance.filter = searchContext.filters;
  }
  try {
    const originalId = savedAgentTraces.id;

    const id = await savedAgentTraces.save(saveOptions);

    if (id && openAfterSave) {
      toastNotifications.addSuccess({
        title: i18n.translate('agentTraces.notifications.SavedAgentTracesTitle', {
          defaultMessage: `Search '{savedQueryTitle}' was saved`,
          values: {
            savedQueryTitle: savedAgentTraces?.title,
          },
        }),
        'data-test-subj': 'savedAgentTracesSuccess',
      });

      if (id !== originalId) {
        services.scopedHistory?.push(`#/view/${encodeURIComponent(id)}`);
      } else {
        chrome.docTitle.change(newTitle);
        chrome.setBreadcrumbs([...getRootBreadcrumbs(), { text: savedAgentTraces.title }]);
      }

      store.dispatch(setSavedSearch(id));

      // starts syncing `_g` portion of url with query services
      startSyncingQueryStateWithUrl();
    }

    return { id };
  } catch (error) {
    toastNotifications.addDanger({
      title: i18n.translate('agentTraces.notifications.notSavedAgentTracesTitle', {
        defaultMessage: `Search '{savedAgentTracesTitle}' was not saved.`,
        values: {
          savedAgentTracesTitle: savedAgentTraces.title,
        },
      }),
      text: (error as Error).message,
    });

    savedAgentTraces.title = currentTitle;

    return { error };
  }
}
