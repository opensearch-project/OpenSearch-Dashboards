/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiPanel, EuiProgress } from '@elastic/eui';
import { QueryExecutionStatus } from '../../../utils/state_management/types';
import { QueryPanelWidgets } from './query_panel_widget';
import { QueryPanelEditor } from './query_editor';
import { QueryPanelGeneratedQuery } from './generated_query_panel';
import { QueryPanelProvider, useQueryPanelContext, QueryPanelProps } from './query_panel_context';

const InnerQueryPanel = () => {
  const {
    queryEditorState,
    showDatasetSelect,
    showLanguageToggle,
    showSaveQueryButton,
  } = useQueryPanelContext();

  const isLoading =
    queryEditorState?.queryStatus?.status === QueryExecutionStatus.LOADING ||
    queryEditorState?.promptToQueryIsLoading;

  const showWidgets = showDatasetSelect || showLanguageToggle || showSaveQueryButton;
  return (
    <EuiPanel
      paddingSize="s"
      borderRadius="none"
      className="exploreInContexQueryPanel"
      style={{ height: '100%' }}
    >
      {showWidgets && <QueryPanelWidgets />}
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

/**
 * QueryPanel component - Exposed for external plugins to use
 */
const QueryPanel = (props: QueryPanelProps) => {
  return (
    <QueryPanelProvider value={props}>
      <InnerQueryPanel />
    </QueryPanelProvider>
  );
};

// eslint-disable-next-line import/no-default-export
export default QueryPanel;
