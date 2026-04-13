/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';
import { EuiPanel, EuiProgress } from '@elastic/eui';
import { QueryEditorState } from '../query_builder/query_builder';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { QueryPanelWidgets } from './query_panel_widget';
import { QueryPanelEditor } from './query_editor';
import { QueryPanelGeneratedQuery } from './generated_query_panel';

export const QueryPanel = ({
  queryEditorState$,
}: {
  queryEditorState$: BehaviorSubject<QueryEditorState>;
}) => {
  const queryEditorState = useObservable(queryEditorState$, queryEditorState$.getValue());

  const isLoading =
    queryEditorState?.queryStatus.status === QueryExecutionStatus.LOADING ||
    queryEditorState?.promptToQueryIsLoading;

  return (
    <EuiPanel
      paddingSize="s"
      borderRadius="none"
      className="exploreInContexQueryPanel"
      style={{ height: '100%' }}
    >
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
