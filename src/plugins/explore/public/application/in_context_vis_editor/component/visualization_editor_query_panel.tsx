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
import { SourceQueryPanelEditor } from './source_query_panel_editor';
import { getSourceTypeRegistry } from '../../../services/source_type_registry';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
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

  // Same editor as on the Metrics page: a source's own editor for its language, the PromQL rows
  // only where the source has a metrics resource client for them, else a single code editor.
  const {
    queryState: { language, dataset },
  } = useQueryBuilderState();
  const registry = getSourceTypeRegistry();
  const sourceQueryEditor = registry.getLanguageSettings(language, dataset)?.metricsQueryEditor;
  const usesPromQLRows =
    languageType === SupportLanguageType.promQL && registry.usesPromQLRows(language, dataset);

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
              ) : !isPromptMode && sourceQueryEditor ? (
                <SourceQueryPanelEditor editor={sourceQueryEditor} />
              ) : !isPromptMode && usesPromQLRows ? (
                <MetricMultiQueryPanelEditor />
              ) : (
                <>
                  <QueryPanelEditor />
                  <QueryPanelGeneratedQuery />
                </>
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
