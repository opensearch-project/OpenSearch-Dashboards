/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { QueryPanel } from './visualization_editor_query_panel';
import { QueryEditorState, SupportLanguageType } from '../query_builder/query_builder';
import { EditorMode, QueryExecutionStatus } from '../../utils/state_management/types';
import {
  SourceTypeDefinition,
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../services/source_type_registry';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';

jest.mock('./query_panel_widget', () => ({ QueryPanelWidgets: () => null }));
jest.mock('./query_editor', () => ({
  QueryPanelEditor: () => <div data-test-subj="codeEditor" />,
}));
jest.mock('./generated_query_panel', () => ({ QueryPanelGeneratedQuery: () => null }));
jest.mock('./metric_multi_query_editor', () => ({
  MetricMultiQueryPanelEditor: () => <div data-test-subj="promqlRows" />,
}));
jest.mock('./source_query_panel_editor', () => ({
  SourceQueryPanelEditor: ({ editor: Editor }: { editor: React.ComponentType<any> }) => (
    <div data-test-subj="sourceEditor">
      <Editor />
    </div>
  ),
}));
jest.mock('../../pages/logs/ppl_builder', () => ({ PPLBuilder: () => null }));
jest.mock('../../pages/logs/ppl_builder/mode_button_group', () => ({
  ModeButtonGroup: () => null,
}));
jest.mock('../hooks/use_visualization_editor_ppl_builder', () => ({
  useVisualizationEditorPPLBuilder: () => ({ showBuilder: false }),
}));
jest.mock('../hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));

const MyEditor = () => <div data-test-subj="mySourceEditor" />;
const source = (overrides: Partial<SourceTypeDefinition>): SourceTypeDefinition => ({
  id: 'my-source',
  label: 'My Source',
  datasetTypes: ['MY_DATASET_TYPE'],
  resolveDefaultDataset: async () => undefined,
  ...overrides,
});

const renderPanel = (
  language: string,
  datasetType: string,
  editorMode: EditorMode = EditorMode.Query
) => {
  (useQueryBuilderState as jest.Mock).mockReturnValue({
    queryState: { query: '', language, dataset: { id: 'ds', title: 'ds', type: datasetType } },
  });
  const state$ = new BehaviorSubject<QueryEditorState>({
    queryStatus: { status: QueryExecutionStatus.UNINITIALIZED },
    editorMode,
    promptModeIsAvailable: false,
    promptToQueryIsLoading: false,
    isQueryEditorDirty: false,
    userInitiatedQuery: false,
    languageType:
      language === 'PROMQL' ? SupportLanguageType.promQL : (language as SupportLanguageType),
  } as QueryEditorState);
  return render(<QueryPanel queryEditorState$={state$} />);
};

describe('visualization editor QueryPanel', () => {
  let registry: SourceTypeRegistryService;

  beforeEach(() => {
    registry = new SourceTypeRegistryService();
    setSourceTypeRegistry(registry);
  });

  it('shows the PromQL rows for a Prometheus connection', () => {
    renderPanel('PROMQL', 'PROMETHEUS');
    expect(screen.getByTestId('promqlRows')).toBeInTheDocument();
  });

  it('shows the PromQL rows on a source with a metrics resource client', () => {
    registry.register(source({ metricsResourceClientId: 'my-metrics' }));
    renderPanel('PROMQL', 'MY_DATASET_TYPE');
    expect(screen.getByTestId('promqlRows')).toBeInTheDocument();
  });

  it('gives PromQL a code editor on a source without a metrics resource client', () => {
    registry.register(source({}));
    renderPanel('PROMQL', 'MY_DATASET_TYPE');
    expect(screen.queryByTestId('promqlRows')).not.toBeInTheDocument();
    expect(screen.getByTestId('codeEditor')).toBeInTheDocument();
  });

  it("uses a source's own editor for its language", () => {
    registry.register(
      source({
        metricsResourceClientId: 'my-metrics',
        languageSettings: { MY_SQL: { metricsQueryEditor: MyEditor } },
      })
    );
    renderPanel('MY_SQL', 'MY_DATASET_TYPE');
    expect(screen.getByTestId('mySourceEditor')).toBeInTheDocument();
    expect(screen.queryByTestId('codeEditor')).not.toBeInTheDocument();
  });

  it("uses a source's own editor for PromQL in place of the rows", () => {
    registry.register(
      source({
        metricsResourceClientId: 'my-metrics',
        languageSettings: { PROMQL: { metricsQueryEditor: MyEditor } },
      })
    );
    renderPanel('PROMQL', 'MY_DATASET_TYPE');
    expect(screen.getByTestId('mySourceEditor')).toBeInTheDocument();
    expect(screen.queryByTestId('promqlRows')).not.toBeInTheDocument();
  });

  it('keeps the code editor in prompt mode', () => {
    renderPanel('PROMQL', 'PROMETHEUS', EditorMode.Prompt);
    expect(screen.getByTestId('codeEditor')).toBeInTheDocument();
    expect(screen.queryByTestId('promqlRows')).not.toBeInTheDocument();
  });
});
