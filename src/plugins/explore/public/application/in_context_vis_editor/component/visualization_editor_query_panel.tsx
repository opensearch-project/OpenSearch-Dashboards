/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';
import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiProgress } from '@elastic/eui';
import { QueryEditorState, SupportLanguageType } from '../query_builder/query_builder';
import { EditorMode, QueryExecutionStatus } from '../../utils/state_management/types';
import { QueryPanelWidgets } from './query_panel_widget';
import { QueryPanelEditor } from './query_editor';
import { MetricMultiQueryPanelEditor } from './metric_multi_query_editor';
import { QueryPanelGeneratedQuery } from './generated_query_panel';
import { PPLBuilder } from '../../pages/logs/ppl_builder';
import { ModeButtonGroup } from '../../pages/logs/ppl_builder/mode_button_group';
import { useVisualizationEditorPPLBuilder } from '../hooks/use_visualization_editor_ppl_builder';
import '../../../components/query_panel/query_panel.scss';
import '../visualization_editor.scss';

export const QueryPanel = ({
  queryEditorState$,
}: {
  queryEditorState$: BehaviorSubject<QueryEditorState>;
}) => {
  const queryEditorState = useObservable(queryEditorState$, queryEditorState$.getValue());
  const languageType = queryEditorState.languageType;

  const isPromptMode = queryEditorState.editorMode === EditorMode.Prompt;
  const isPPLQueryMode = languageType === SupportLanguageType.ppl && !isPromptMode;
  const {
    mode,
    showBuilder,
    builderKey,
    builderState,
    datasetOverride,
    builderDisabled,
    modeToggleTooltip,
    handleModeChange,
    handleBuilderChange,
    handleBuilderRun,
  } = useVisualizationEditorPPLBuilder(isPPLQueryMode);

  const isLoading =
    queryEditorState?.queryStatus.status === QueryExecutionStatus.LOADING ||
    queryEditorState?.promptToQueryIsLoading;

  return (
    <EuiPanel
      paddingSize="s"
      borderRadius="none"
      className="visualizationEditorTabPanel"
      hasBorder={false}
      hasShadow={false}
    >
      <QueryPanelWidgets />
      <div className="visualizationEditorTabPanel__editorsWrapper">
        <EuiFlexGroup
          gutterSize="s"
          alignItems="flexStart"
          responsive={false}
          className="visualizationEditorTabPanel__contentRow"
        >
          <EuiFlexItem>
            <div className="visualizationEditorTabPanel__editorBody">
              {showBuilder ? (
                <PPLBuilder
                  key={builderKey}
                  datasetOverride={datasetOverride}
                  initialState={builderState}
                  onQueryChange={handleBuilderChange}
                  onRun={handleBuilderRun}
                />
              ) : languageType !== SupportLanguageType.promQL || isPromptMode ? (
                <>
                  <QueryPanelEditor />
                  <QueryPanelGeneratedQuery />
                </>
              ) : (
                <MetricMultiQueryPanelEditor />
              )}
            </div>
          </EuiFlexItem>
          {isPPLQueryMode && (
            <EuiFlexItem grow={false}>
              <ModeButtonGroup
                mode={mode}
                onChange={handleModeChange}
                builderDisabled={builderDisabled}
                tooltip={modeToggleTooltip}
              />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
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
