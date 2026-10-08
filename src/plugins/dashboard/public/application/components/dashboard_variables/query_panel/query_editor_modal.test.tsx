/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act } from 'react-dom/test-utils';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
// @ts-expect-error TS2306 TODO(ts-error): fixme
import { findTestSubject } from '@elastic/eui/lib/test';

// Stub the context hook so `services`/`data` are whatever this test controls,
// instead of needing a full OpenSearchDashboardsReactContext provider tree.
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

// Monaco (via VariableQueryCodeEditor) is not relevant to this modal's own
// Apply/Preview/auto-run logic and is heavy to mount in jsdom — stub it with a
// minimal control surface (a button that calls onRunQuery, like the real
// Ctrl+Enter binding) so free-text Preview-triggering tests still work.
jest.mock('./variable_query_code_editor', () => ({
  VariableQueryCodeEditor: (props: any) => (
    <div>
      <input
        data-test-subj="mockCodeEditorInput"
        value={props.query}
        onChange={(e) => props.onQueryChange(e.target.value)}
      />
      <button data-test-subj="mockCodeEditorRunQuery" onClick={props.onRunQuery}>
        mock code editor
      </button>
    </div>
  ),
}));

jest.mock('./promql/metrics_explorer_modal', () => ({
  MetricsExplorerModal: () => <div data-test-subj="mockMetricsExplorerModal" />,
}));

// LanguageToggle/DatasetSelectWidget pull in the data plugin's language
// service and DatasetSelect component — irrelevant to this modal's own
// Apply/Preview/auto-run wiring. Stub with minimal controls that drive the
// same callbacks the real components expose.
jest.mock('./language_toggle', () => ({
  LanguageToggle: (props: any) => (
    <button
      data-test-subj="languageToggle"
      onClick={() => props.onLanguageChange(props.language === 'PPL' ? 'PROMQL' : 'PPL')}
    >
      {props.language}
    </button>
  ),
}));

jest.mock('./dataset_select_widget', () => ({
  DatasetSelectWidget: () => <div data-test-subj="mockDatasetSelectWidget" />,
}));

// The PromQL dropdown data hook hits the Prometheus resource client over the
// network — stub it to isolate this modal's own state/wiring logic.
jest.mock('./promql/use_promql_dropdown_data', () => ({
  usePromqlDropdownData: ({ promQLResourceQuery }: any) => ({
    promqlLabelNameOptions: [],
    promqlLabelNamesLoading: false,
    loadLabelNames: jest.fn(),
    promqlMetricNameOptions: [],
    promqlMetricNamesLoading: false,
    loadMetricNames: jest.fn(),
    getMatcherValueOptions: () => [],
    loadMatcherValues: jest.fn(),
    isMatcherValueLoading: () => false,
    promqlMatchers:
      promQLResourceQuery?.kind === 'labelValues' ? (promQLResourceQuery.matchers ?? []) : [],
    addPromqlMatcher: jest.fn(),
    updatePromqlMatcherAt: jest.fn(),
    removePromqlMatcherAt: jest.fn(),
  }),
}));

jest.mock('../../../../variables/variable_query_utils', () => ({
  ...jest.requireActual('../../../../variables/variable_query_utils'),
  executeVariableQuery: jest.fn(),
}));

jest.mock('../../../../variables/promql_variable_query_utils', () => ({
  ...jest.requireActual('../../../../variables/promql_variable_query_utils'),
  executePromQLResourceQuery: jest.fn(),
}));

import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { executeVariableQuery } from '../../../../variables/variable_query_utils';
import { executePromQLResourceQuery } from '../../../../variables/promql_variable_query_utils';
import { QueryEditorModal, QueryEditorModalProps } from './query_editor_modal';

const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.Mock;
const mockExecuteVariableQuery = executeVariableQuery as jest.Mock;
const mockExecutePromQLResourceQuery = executePromQLResourceQuery as jest.Mock;

function makeQueryResult(
  rows: Array<Record<string, unknown>>,
  fields: string[] = [],
  fieldTypes: Record<string, 'string' | 'number' | 'boolean'> = {}
) {
  return { rows, fields, fieldTypes };
}

const mockData: any = {
  query: { timefilter: { timefilter: { getTime: jest.fn().mockReturnValue(undefined) } } },
};

function defaultProps(overrides: Partial<QueryEditorModalProps> = {}): QueryEditorModalProps {
  return {
    query: '',
    language: 'PPL',
    dataset: undefined,
    existingVariableNames: [],
    regex: '',
    useTimeFilter: false,
    valueField: '',
    labelField: '',
    promQLResourceQuery: undefined,
    onApply: jest.fn(),
    onDiscard: jest.fn(),
    ...overrides,
  };
}

async function mountModal(overrides: Partial<QueryEditorModalProps> = {}) {
  const onApply = jest.fn();
  const onDiscard = jest.fn();
  const props = defaultProps({ onApply, onDiscard, ...overrides });
  let component: any;
  await act(async () => {
    component = mountWithIntl(<QueryEditorModal {...props} />);
  });
  component.update();
  return { component, onApply, onDiscard };
}

async function clickApply(component: any) {
  await act(async () => {
    findTestSubject(component, 'queryEditorModalApply').simulate('click');
  });
  component.update();
}

async function clickPreview(component: any) {
  await act(async () => {
    findTestSubject(component, 'queryEditorModalRunQuery').simulate('click');
  });
  component.update();
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseOpenSearchDashboards.mockReturnValue({ services: { data: mockData } });
  mockExecuteVariableQuery.mockResolvedValue(makeQueryResult([]));
  mockExecutePromQLResourceQuery.mockResolvedValue([]);
});

describe('QueryEditorModal — Apply gating', () => {
  it('blocks Apply and shows the callout when no Preview has been run', async () => {
    // dataset: undefined on mount avoids the auto-run-Preview-on-mount effect,
    // isolating the "never previewed" gating behavior under test.
    const { component, onApply } = await mountModal({
      dataset: undefined,
      query: 'source = logs',
    });

    await clickApply(component);

    expect(onApply).not.toHaveBeenCalled();
    expect(findTestSubject(component, 'queryEditorModalApplyError').length).toBe(1);
    expect(findTestSubject(component, 'queryEditorModalApplyError').first().text()).toContain(
      'You must preview the query successfully before applying'
    );
  });

  it('allows Apply once Preview succeeds, even with zero rows ("no results")', async () => {
    mockExecuteVariableQuery.mockResolvedValue(makeQueryResult([]));
    const { component, onApply } = await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      query: 'source = logs',
    });

    await clickPreview(component);
    await clickApply(component);

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(findTestSubject(component, 'queryEditorModalApplyError').length).toBe(0);
  });

  it('does not allow Apply when Preview succeeds but the value field is misconfigured', async () => {
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult([{ nested: { a: 1 } }], ['nested'], {})
    );
    const { component, onApply } = await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      query: 'source = logs',
      valueField: 'nested',
    });

    await clickPreview(component);
    await clickApply(component);

    expect(onApply).not.toHaveBeenCalled();
    expect(findTestSubject(component, 'queryEditorModalApplyError').length).toBe(1);
  });
});

describe('QueryEditorModal — applyError callout auto-clears', () => {
  it('clears the callout once a fresh, valid Preview run completes — no second Apply click needed', async () => {
    const { component, onApply } = await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      query: '   ',
    });

    // First Apply with an empty query is rejected and shows the callout.
    await clickApply(component);
    expect(findTestSubject(component, 'queryEditorModalApplyError').length).toBe(1);

    // Type a real query via the mocked code editor's onQueryChange, then run
    // Preview successfully.
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult([{ service: 'api' }], ['service'], { service: 'string' })
    );
    await act(async () => {
      findTestSubject(component, 'mockCodeEditorInput').simulate('change', {
        target: { value: 'source = logs' },
      });
    });
    component.update();
    await act(async () => {
      findTestSubject(component, 'mockCodeEditorRunQuery').simulate('click');
    });
    component.update();

    // The callout should already be gone — driven by canApply becoming true,
    // true, not by the user clicking Apply again.
    expect(findTestSubject(component, 'queryEditorModalApplyError').length).toBe(0);

    await clickApply(component);
    expect(onApply).toHaveBeenCalledTimes(1);
  });
});

describe('QueryEditorModal — field switches do not require a re-Preview', () => {
  it('keeps Apply enabled when switching Value field after a successful Preview', async () => {
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult(
        [
          { service: 'api', agent: 'chrome' },
          { service: 'web', agent: 'firefox' },
        ],
        ['service', 'agent'],
        { service: 'string', agent: 'string' }
      )
    );
    const { component, onApply } = await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      query: 'source = logs',
      valueField: 'service',
    });

    // The pre-existing draft auto-runs Preview once on mount — no explicit click needed.
    expect(mockExecuteVariableQuery).toHaveBeenCalledTimes(1);

    // Switch Value field via the EuiComboBox's onCreateOption (avoids needing
    // to drive the popover open/close interactions).
    await act(async () => {
      const comboBox = component.find('EuiComboBox[data-test-subj="variableEditorValueField"]');
      (comboBox.props() as any).onCreateOption('agent');
    });
    component.update();

    // No second network call — the switch is a pure client-side re-derivation.
    expect(mockExecuteVariableQuery).toHaveBeenCalledTimes(1);
    expect(findTestSubject(component, 'queryEditorModalApplyError').length).toBe(0);

    await clickApply(component);
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ valueField: 'agent' }));
  });

  it('requires a fresh Preview after the dataset changes', async () => {
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult([{ service: 'api' }], ['service'], { service: 'string' })
    );
    const { component, onApply } = await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      query: 'source = logs',
    });

    await clickPreview(component);
    await clickApply(component);
    expect(onApply).toHaveBeenCalledTimes(1);

    // Switching dataset invalidates any previously-fetched freeTextResult.
    // DatasetSelectWidget is stubbed and does not expose a DOM affordance, so
    // exercise the equivalent hard-invalidating path via language switch
    // instead (also resets dataset and forces a fresh Preview).
    await act(async () => {
      findTestSubject(component, 'languageToggle').simulate('click');
    });
    component.update();

    await clickApply(component);
    expect(onApply).toHaveBeenCalledTimes(1); // still only the first, successful Apply
    expect(findTestSubject(component, 'queryEditorModalApplyError').length).toBe(1);
  });
});

describe('QueryEditorModal — auto-run Preview on mount', () => {
  it('auto-runs the free-text query when opened with a pre-existing, non-empty draft', async () => {
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult([{ service: 'api' }], ['service'], { service: 'string' })
    );

    await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      query: 'source = logs',
    });

    expect(mockExecuteVariableQuery).toHaveBeenCalledTimes(1);
  });

  it('does not auto-run when opened with an empty query (new-variable flow)', async () => {
    await mountModal({ dataset: undefined, query: '' });

    expect(mockExecuteVariableQuery).not.toHaveBeenCalled();
    expect(mockExecutePromQLResourceQuery).not.toHaveBeenCalled();
  });

  it('auto-runs the PromQL resource query when opened with a pre-existing labelValues draft', async () => {
    mockExecutePromQLResourceQuery.mockResolvedValue(['prometheus', 'node']);

    await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      language: 'PROMQL',
      promQLResourceQuery: { kind: 'labelValues', label: 'job' },
    });

    expect(mockExecutePromQLResourceQuery).toHaveBeenCalledTimes(1);
  });

  it('does not auto-run the PromQL resource query when there is no query type', async () => {
    await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      language: 'PROMQL',
      query: 'up',
      promQLResourceQuery: undefined,
    });

    // No query type means the free-text path, which goes through
    // executeVariableQuery and never through the resource client.
    expect(mockExecutePromQLResourceQuery).not.toHaveBeenCalled();
    expect(mockExecuteVariableQuery).toHaveBeenCalledTimes(1);
  });

  it('does not auto-run the PromQL resource query when there is no dataset yet', async () => {
    await mountModal({
      dataset: undefined,
      language: 'PROMQL',
      promQLResourceQuery: { kind: 'labelValues', label: 'job' },
    });

    expect(mockExecutePromQLResourceQuery).not.toHaveBeenCalled();
  });

  // Regression: opening an *existing saved* labelValues variable whose matchers
  // is [] (never added a filter) must still show a default placeholder row —
  // not just newly-selected labelValues / a dataset reset. Otherwise "Label
  // filters" renders as an empty section with only "+ Add label filter",
  // inconsistent with every other entry point into this query type.
  it('normalizes an existing saved variable with empty matchers to show a default placeholder row', async () => {
    const { component } = await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      language: 'PROMQL',
      promQLResourceQuery: { kind: 'labelValues', label: 'job', matchers: [] },
    });

    expect(component.find('[data-test-subj="variableEditorPromqlMatcherLabel-0"]').exists()).toBe(
      true
    );
  });
});

describe('QueryEditorModal — handleApply payload shaping', () => {
  it('strips empty label matchers and applies the selected value/label fields for free-text', async () => {
    mockExecuteVariableQuery.mockResolvedValue(
      makeQueryResult([{ service: 'api' }], ['service'], { service: 'string' })
    );
    const { component, onApply } = await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      query: 'source = logs',
      valueField: 'service',
      labelField: '',
      regex: 'api',
    });

    await clickPreview(component);
    await clickApply(component);

    expect(onApply).toHaveBeenCalledWith({
      query: 'source = logs',
      language: 'PPL',
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      valueField: 'service',
      labelField: '',
      regex: 'api',
      promQLResourceQuery: undefined,
    });
  });

  it('omits query/valueField/labelField for PromQL resource queries and filters empty matchers', async () => {
    mockExecutePromQLResourceQuery.mockResolvedValue(['prometheus']);
    const { component, onApply } = await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      language: 'PROMQL',
      promQLResourceQuery: {
        kind: 'labelValues',
        label: 'job',
        matchers: [
          { label: 'env', operator: '=', value: 'prod' },
          { label: '', operator: '=', value: '' },
        ],
      },
    });

    await clickPreview(component);
    await clickApply(component);

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        query: '',
        valueField: '',
        labelField: '',
        promQLResourceQuery: {
          kind: 'labelValues',
          label: 'job',
          matchers: [{ label: 'env', operator: '=', value: 'prod' }],
        },
      })
    );
  });
});

describe('QueryEditorModal — language switch resets incompatible state', () => {
  it('clears dataset/query/promQLResourceQuery when toggling from PPL to PromQL', async () => {
    const { component } = await mountModal({
      dataset: { id: 'ds-1', title: 'ds-1', type: 'INDEX_PATTERN' },
      query: 'source = logs',
      language: 'PPL',
    });

    await act(async () => {
      findTestSubject(component, 'languageToggle').simulate('click');
    });
    component.update();

    // After switching, Preview must be re-run before Apply — dataset was reset.
    await clickApply(component);
    expect(findTestSubject(component, 'queryEditorModalApplyError').length).toBe(1);
  });
});
