/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useCurrentAgentTracesId } from './use_current_agent_traces_id';
import { useSavedAgentTraces } from './use_saved_agent_traces';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../types';
import {
  setSavedSearch,
  setQueryState,
  setActiveTab,
  clearResults,
  clearQueryStatusMap,
  clearLastExecutedData,
  setEditorMode,
  setUsingRegexPatterns,
} from '../state_management/slices';
import { executeQueries } from '../state_management/actions/query_actions';
import { AgentTracesFlavor } from '../../../../common';
import { useSetEditorText } from '../../hooks';
import { EditorMode } from '../state_management/types';

export const useInitPage = () => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const agentTracesId = useCurrentAgentTracesId();
  const { savedAgentTraces, error } = useSavedAgentTraces(agentTracesId);
  const setEditorText = useSetEditorText();
  const { chrome, data } = services;

  useEffect(() => {
    if (savedAgentTraces && !error) {
      if (savedAgentTraces.id) {
        // Deserialize state from saved object
        const { title } = savedAgentTraces;

        // Update browser title and breadcrumbs
        chrome.docTitle.change(title);
        chrome.setBreadcrumbs([{ text: 'Agent Traces', href: '#/' }, { text: title }]);

        // Sync query from saved object to data plugin (agent traces doesn't use filters)
        const searchSourceFields = savedAgentTraces.kibanaSavedObjectMeta;
        const queryFromUrl = services.osdUrlStateStorage?.get('_q') ?? {};
        if (searchSourceFields?.searchSourceJSON) {
          const searchSource = JSON.parse(searchSourceFields.searchSourceJSON);
          const queryFromSavedSearch = searchSource.query;
          const query = {
            ...queryFromSavedSearch,
            ...queryFromUrl,
            query: queryFromUrl.query || queryFromSavedSearch.query,
          };
          if (query) {
            dispatch(setQueryState(query));
            setEditorText(query.query);
          }
        }

        // Update savedSearch to store just the ID (like discover)
        // TODO: remove this once legacy state is not consumed any more
        dispatch(setSavedSearch(savedAgentTraces.id));

        // Init ui state
        const uiState = savedAgentTraces.uiState;
        if (uiState) {
          const { activeTab } = JSON.parse(uiState);
          dispatch(setActiveTab(activeTab));
        }

        // Add to recently accessed
        chrome.recentlyAccessed.add(
          `/app/agentTraces/${savedAgentTraces.type ?? AgentTracesFlavor.Traces}#/view/${
            savedAgentTraces.id
          }`,
          title,
          savedAgentTraces.id,
          { type: 'agentTraces' }
        );

        dispatch(clearLastExecutedData());
        dispatch(setEditorMode(EditorMode.Query));
        dispatch(clearResults());
        dispatch(clearQueryStatusMap());
        dispatch(setUsingRegexPatterns(false));
        dispatch(executeQueries({ services }));
      }
    }
    if (error) {
      // Navigate to management page for invalid IDs
      // TODO: need to confirm the UI behavior for invalid ID, the current logic is copied from useSavedAgentTraces hook
      if (error.includes('Not found')) {
        chrome.setBreadcrumbs([{ text: 'Agent Traces', href: '#/' }, { text: 'Error' }]);
      }
    }
  }, [chrome, data.query.queryString, dispatch, error, savedAgentTraces, services, setEditorText]);

  const pageContext = { savedAgentTraces };

  return pageContext;
};
