/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { EuiPanel, EuiProgress } from '@elastic/eui';
import { QueryPanelEditor } from './query_panel_editor';
import { QueryPanelWidgets } from './query_panel_widgets';
import {
  selectIsLoading,
  selectPromptToQueryIsLoading,
} from '../../application/utils/state_management/selectors';
import { QueryPanelGeneratedQuery } from './query_panel_generated_query';
import { usePPLExecuteQueryAction } from './actions/ppl_execute_query_action';
import { useSetEditorTextWithQuery } from '../../application/hooks';
import './query_panel.scss';

const QueryPanel = () => {
  const queryIsLoading = useSelector(selectIsLoading);
  const promptToQueryIsLoading = useSelector(selectPromptToQueryIsLoading);
  const isLoading = queryIsLoading || promptToQueryIsLoading;

  // Hook for updating editor text with query
  const setEditorTextWithQuery = useSetEditorTextWithQuery();

  // Register the PPL execute query action for assistant integration
  usePPLExecuteQueryAction(setEditorTextWithQuery);

  return (
    <EuiPanel paddingSize="s">
      <QueryPanelWidgets />
      <div className="exploreQueryPanel__editorsWrapper">
        <QueryPanelEditor />
        <QueryPanelGeneratedQuery />
      </div>
      {isLoading && (
        <EuiProgress
          size="xs"
          color="accent"
          position="absolute"
          data-test-subj="exploreQueryPanelIsLoading"
        />
      )}
    </EuiPanel>
  );
};

export { QueryPanel };
