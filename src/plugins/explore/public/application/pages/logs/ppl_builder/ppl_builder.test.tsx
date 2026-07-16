/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { PPLBuilder } from './ppl_builder';
import { PPLBuilderState, emptyState } from './types';

// Mock the shared react kibana module: CodeEditor (used by SearchBox) is
// rendered as a simple textbox so we can drive onChange, and
// useOpenSearchDashboards returns the minimal services the builder reads.
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  CodeEditor: ({ value, onChange }: any) => (
    <input
      data-test-subj="pplBuilderSearchBoxInput"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  useOpenSearchDashboards: jest.fn(() => ({
    services: {
      uiSettings: { get: jest.fn() },
      data: {
        query: {
          queryString: { getQuery: jest.fn(() => ({ dataset: undefined })) },
          timefilter: { timefilter: { getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })) } },
        },
        search: { aggs: { createAggConfigs: jest.fn() } },
      },
    },
  })),
}));

// @osd/monaco is globally mocked; SearchBox only needs monaco.languages.register.

// createHistogramConfigs pulls in the whole data plugin; stub it so the auto
// span interval derivation resolves without that import chain.
jest.mock('../../../../components/chart/utils', () => ({
  createHistogramConfigs: jest.fn(() => ({
    aggs: [{}, { buckets: { getInterval: () => ({ expression: '30s' }) } }],
  })),
}));

// The dataset context supplies the resolved DataView; the builder reads
// dataset.timeFieldName for span derivation.
jest.mock('../../../context', () => ({
  useDatasetContext: () => ({ dataset: { timeFieldName: '@timestamp' } }),
}));

// The field-data hook talks to services/autocomplete; stub it with static data.
jest.mock('./use_field_data', () => ({
  useFieldData: () => ({
    fields: [{ name: 'service' }, { name: 'bytes', type: 'number' }, { name: 'service.keyword' }],
    fieldNames: ['service', 'bytes', 'service.keyword'],
    // `.keyword` sub-fields are excluded — the PPL engine rejects them as a
    // sort target.
    sortableFieldNames: ['service', 'bytes'],
    numericAndAggregatableNames: ['bytes'],
    numericFieldNames: ['bytes'],
    // Group-by options exclude date-typed fields — time grouping is the
    // "over time" popover entry, not a bare @timestamp field.
    groupByFieldNames: ['service', 'bytes', 'service.keyword'],
    timeFieldName: '@timestamp',
    getValues: jest.fn(async () => []),
  }),
}));

const renderBuilder = (initialState: PPLBuilderState = emptyState(), onRun?: () => void) => {
  const onQueryChange = jest.fn();
  const utils = render(
    <PPLBuilder initialState={initialState} onQueryChange={onQueryChange} onRun={onRun} />
  );
  return { ...utils, onQueryChange };
};

describe('PPLBuilder', () => {
  it('renders the search box and group rows', () => {
    renderBuilder();
    expect(screen.getByText('Search for')).toBeInTheDocument();
    expect(screen.getByText('Group into')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderSearchBox')).toBeInTheDocument();
  });

  it('emits a source-less (empty) query on mount for an empty state', () => {
    const { onQueryChange } = renderBuilder();
    expect(onQueryChange).toHaveBeenCalledWith('', expect.anything());
  });

  it('seeds the search box from the existing search expression and emits it source-less', () => {
    const { onQueryChange } = renderBuilder({
      ...emptyState(),
      searchExpression: 'service="web-store"',
    });
    expect(onQueryChange).toHaveBeenCalledWith('service="web-store"', expect.anything());
    expect(screen.getByTestId('pplBuilderSearchBoxInput')).toHaveValue('service="web-store"');
  });

  it('runs the query on Cmd/Ctrl+Enter from a form control', () => {
    const onRun = jest.fn();
    renderBuilder(emptyState(), onRun);
    fireEvent.keyDown(screen.getByTestId('pplBuilder'), { key: 'Enter', metaKey: true });
    expect(onRun).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByTestId('pplBuilder'), { key: 'Enter', ctrlKey: true });
    expect(onRun).toHaveBeenCalledTimes(2);
  });

  it('does not run on a bare Enter (no modifier)', () => {
    const onRun = jest.fn();
    renderBuilder(emptyState(), onRun);
    fireEvent.keyDown(screen.getByTestId('pplBuilder'), { key: 'Enter' });
    expect(onRun).not.toHaveBeenCalled();
  });

  it('emits typed search text without a source clause', () => {
    const { onQueryChange } = renderBuilder();
    fireEvent.change(screen.getByTestId('pplBuilderSearchBoxInput'), {
      target: { value: 'status>=500 AND error' },
    });
    expect(onQueryChange).toHaveBeenLastCalledWith('status>=500 AND error', expect.anything());
  });

  it('emits a leading pipe for a stats-only query so source prepends cleanly', () => {
    const { onQueryChange } = renderBuilder();
    // "Add metric" opens an aggregation picker; choosing Count appends the metric.
    fireEvent.click(screen.getByTestId('pplBuilderAddAggregation'));
    fireEvent.click(screen.getByText('Count'));
    expect(onQueryChange).toHaveBeenLastCalledWith('| stats count()', expect.anything());
  });

  it('renders a natural-language "every" chip and interval for a time-grouped state', () => {
    renderBuilder({
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: [], span: { field: '@timestamp', interval: '5m', auto: false } },
    });
    const chip = screen.getByTestId('pplBuilderSpanChip');
    expect(chip).toBeInTheDocument();
    // The chip reads as plain language, not `span(...)`.
    expect(chip).toHaveTextContent('every');
    // The interval is a popover trigger button showing the current value.
    expect(screen.getByTestId('pplBuilderSpanInterval')).toHaveTextContent('5m');
  });

  it('changes the span interval from the interval popover presets', () => {
    const { onQueryChange } = renderBuilder({
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: [], span: { field: '@timestamp', interval: '5m', auto: false } },
    });
    // Open the interval popover and pick a common preset.
    fireEvent.click(screen.getByTestId('pplBuilderSpanInterval'));
    fireEvent.click(screen.getByTestId('pplBuilderSpanIntervalOption-1h'));
    expect(onQueryChange).toHaveBeenLastCalledWith(
      '| stats count() by span(@timestamp, 1h)',
      expect.anything()
    );
  });

  it('adds time grouping from the "over time" entry in the group-by popover', () => {
    const { onQueryChange } = renderBuilder({
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: [] },
    });
    // Open the group-by popover (the "Everything" placeholder is its trigger).
    fireEvent.click(screen.getByTestId('pplBuilderGroupByFields'));
    // "Over time" leads the list; picking it adds a span on the time field. The
    // mocked auto interval is 30s (see createHistogramConfigs stub).
    fireEvent.click(screen.getByTestId('pplBuilderGroupByOverTime'));
    expect(onQueryChange).toHaveBeenLastCalledWith(
      '| stats count() by span(@timestamp, 30s)',
      expect.anything()
    );
  });

  it('removes time grouping via the chip ✕', () => {
    const { onQueryChange } = renderBuilder({
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: [], span: { field: '@timestamp', interval: '5m', auto: false } },
    });
    fireEvent.click(screen.getByTestId('pplBuilderRemoveSpan'));
    expect(onQueryChange).toHaveBeenLastCalledWith('| stats count()', expect.anything());
  });

  it('offers an "Add sort" affordance as its own operation, even without aggregation', () => {
    renderBuilder();
    // Sort is an independent pipe stage: available up front, not gated on stats.
    expect(screen.getByTestId('pplBuilderAddSort')).toBeInTheDocument();
  });

  it('sorts raw rows by a dataset field when the query does not aggregate', () => {
    const { onQueryChange } = renderBuilder();
    fireEvent.click(screen.getByTestId('pplBuilderAddSort'));
    // Defaults to the first sortable dataset field (service), descending.
    expect(onQueryChange).toHaveBeenLastCalledWith('| sort -service', expect.anything());
  });

  it('omits `.keyword` sub-fields from the sort column suggestions', () => {
    renderBuilder({ ...emptyState(), sort: { column: 'service', desc: true } });
    // Open the sort column field popover to reveal its option list.
    fireEvent.click(screen.getByTestId('pplBuilderSortColumn'));
    // The plain fields are offered; the unsortable `.keyword` sub-field is not.
    expect(screen.getByTestId('pplBuilderFieldOption-service')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderFieldOption-bytes')).toBeInTheDocument();
    expect(screen.queryByTestId('pplBuilderFieldOption-service.keyword')).not.toBeInTheDocument();
  });

  it('adds a descending sort on the first output column of an aggregated query', () => {
    const { onQueryChange } = renderBuilder({
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: ['service'] },
    });
    fireEvent.click(screen.getByTestId('pplBuilderAddSort'));
    // Defaults to the first sortable column (the count() metric), descending.
    expect(onQueryChange).toHaveBeenLastCalledWith(
      '| stats count() by service | sort -`count()`',
      expect.anything()
    );
  });

  it('renders a sort chip and removes the sort', () => {
    const { onQueryChange } = renderBuilder({
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: ['service'] },
      sort: { column: 'service', desc: false },
    });
    expect(screen.getByTestId('pplBuilderSortChip')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('pplBuilderRemoveSort'));
    expect(onQueryChange).toHaveBeenLastCalledWith('| stats count() by service', expect.anything());
  });
});
