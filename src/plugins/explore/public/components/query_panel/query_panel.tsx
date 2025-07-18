/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { EuiPanel, EuiProgress } from '@elastic/eui';
import { QueryPanelEditor } from './query_panel_editor';
import { QueryPanelFooter } from './footer';
import {
  selectIsLoading,
  selectPromptToQueryIsLoading,
} from '../../application/utils/state_management/selectors';
import { QueryPanelGeneratedQuery } from './query_panel_generated_query';
import './query_panel.scss';

const QueryPanel = () => {
  const queryIsLoading = useSelector(selectIsLoading);
  const promptToQueryIsLoading = useSelector(selectPromptToQueryIsLoading);
  const isLoading = queryIsLoading || promptToQueryIsLoading;

  return (
    <EuiPanel paddingSize="s">
      <div className="exploreQueryPanel__editorsWrapper">
        <QueryPanelEditor />
        <QueryPanelGeneratedQuery />
      </div>
      <QueryPanelFooter />
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
