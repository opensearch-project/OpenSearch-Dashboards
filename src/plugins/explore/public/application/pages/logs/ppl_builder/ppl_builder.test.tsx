/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { PPLBuilder } from './ppl_builder';
import { PPLBuilderState, emptyState } from './types';

// Render CodeEditor as a plain textbox so onChange is drivable; stub services the builder reads.
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

// Stub createHistogramConfigs to avoid pulling in the whole data plugin.
jest.mock('../../../../components/chart/utils', () => ({
  createHistogramConfigs: jest.fn(() => ({
    aggs: [{}, { buckets: { getInterval: () => ({ expression: '30s' }) } }],
  })),
}));

jest.mock('../../../context', () => ({
  useDatasetContext: () => ({ dataset: { timeFieldName: '@timestamp' } }),
}));

jest.mock('./use_field_data', () => ({
  useFieldData: () => ({
    fields: [{ name: 'service' }, { name: 'bytes', type: 'number' }, { name: 'service.keyword' }],
    fieldNames: ['service', 'bytes', 'service.keyword'],
    // `.keyword` sub-fields excluded: the PPL engine rejects them as sort targets.
    sortableFieldNames: ['service', 'bytes'],
    numericAndAggregatableNames: ['bytes'],
    numericFieldNames: ['bytes'],
    // Group-by excludes date-typed fields: time grouping is the "over time" popover entry.
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

const countState = (interval?: string): PPLBuilderState => ({
  ...emptyState(),
  aggregations: [{ id: 'a', fn: 'count' }],
  groupBy: interval
    ? { fields: [], span: { field: '@timestamp', interval, auto: false } }
    : { fields: [] },
});

describe('PPLBuilder', () => {
  it('renders the search box and group rows', () => {
    renderBuilder();
    expect(screen.getByText('Search for')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderAddAggregation')).toHaveTextContent('Aggregation');
    expect(screen.getByTestId('pplBuilderAddGroupBy')).toHaveTextContent('Group by');
    expect(screen.getByTestId('pplBuilderSearchBox')).toBeInTheDocument();
  });

  it('adds an aggregation without expanding group-by', () => {
    const { onQueryChange } = renderBuilder();
    fireEvent.click(screen.getByTestId('pplBuilderAddAggregation'));
    fireEvent.click(screen.getByText('Count'));
    expect(onQueryChange).toHaveBeenLastCalledWith('| stats count()', expect.anything());
    expect(screen.getByTestId('pplBuilderAddGroupBy')).toBeInTheDocument();
    expect(screen.queryByTestId('pplBuilderGroupByFields')).not.toBeInTheDocument();
  });

  it('expands both components with a default count() when "+ Group by" is clicked directly', () => {
    const { onQueryChange } = renderBuilder();
    fireEvent.click(screen.getByTestId('pplBuilderAddGroupBy'));
    expect(onQueryChange).toHaveBeenLastCalledWith('| stats count()', expect.anything());
    expect(screen.getByTestId('pplBuilderGroupByFields')).toBeInTheDocument();
    expect(screen.queryByTestId('pplBuilderAddGroupBy')).not.toBeInTheDocument();
    // Field picker auto-opens, so its options are visible without a further click.
    expect(screen.getByTestId('pplBuilderFieldOption-service')).toBeInTheDocument();
  });

  it('drops group-by selections when the aggregation is removed, resetting to Everything', () => {
    const { onQueryChange } = renderBuilder({
      ...countState(),
      groupBy: { fields: ['service'] },
    });
    expect(onQueryChange).toHaveBeenLastCalledWith('| stats count() by service', expect.anything());
    fireEvent.click(screen.getByTestId('pplBuilderRemoveAgg-0'));
    expect(screen.getByTestId('pplBuilderAddGroupBy')).toBeInTheDocument();
    // Re-expanding shows "Everything", not the prior `service` field.
    fireEvent.click(screen.getByTestId('pplBuilderAddGroupBy'));
    expect(onQueryChange).toHaveBeenLastCalledWith('| stats count()', expect.anything());
    expect(screen.getByTestId('pplBuilderGroupByFields')).toHaveTextContent('Everything');
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
    fireEvent.click(screen.getByTestId('pplBuilderAddAggregation'));
    fireEvent.click(screen.getByText('Count'));
    expect(onQueryChange).toHaveBeenLastCalledWith('| stats count()', expect.anything());
  });

  it('renders a natural-language "every" chip and interval for a time-grouped state', () => {
    renderBuilder(countState('5m'));
    const chip = screen.getByTestId('pplBuilderSpanChip');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('every');
    expect(screen.getByTestId('pplBuilderSpanInterval')).toHaveTextContent('5m');
  });

  it('changes the span interval from the interval popover presets', () => {
    const { onQueryChange } = renderBuilder(countState('5m'));
    fireEvent.click(screen.getByTestId('pplBuilderSpanInterval'));
    fireEvent.click(screen.getByTestId('pplBuilderSpanIntervalOption-1h'));
    expect(onQueryChange).toHaveBeenLastCalledWith(
      '| stats count() by span(@timestamp, 1h)',
      expect.anything()
    );
  });

  it('adds time grouping from the "over time" entry in the group-by popover', () => {
    const { onQueryChange } = renderBuilder(countState());
    fireEvent.click(screen.getByTestId('pplBuilderAddGroupBy'));
    fireEvent.click(screen.getByTestId('pplBuilderGroupByFields'));
    // Mocked auto interval is 30s (see createHistogramConfigs stub).
    fireEvent.click(screen.getByTestId('pplBuilderGroupByOverTime'));
    expect(onQueryChange).toHaveBeenLastCalledWith(
      '| stats count() by span(@timestamp, 30s)',
      expect.anything()
    );
  });

  it('removes time grouping via the chip ✕', () => {
    const { onQueryChange } = renderBuilder(countState('5m'));
    fireEvent.click(screen.getByTestId('pplBuilderRemoveSpan'));
    expect(onQueryChange).toHaveBeenLastCalledWith('| stats count()', expect.anything());
  });

  it('offers an "Add sort" affordance as its own operation, even without aggregation', () => {
    renderBuilder();
    expect(screen.getByTestId('pplBuilderAddSort')).toBeInTheDocument();
  });

  it('sorts raw rows by a dataset field when the query does not aggregate', () => {
    const { onQueryChange } = renderBuilder();
    fireEvent.click(screen.getByTestId('pplBuilderAddSort'));
    expect(onQueryChange).toHaveBeenLastCalledWith('| sort -service', expect.anything());
  });

  it('omits `.keyword` sub-fields from the sort column suggestions', () => {
    renderBuilder({ ...emptyState(), sort: { column: 'service', desc: true } });
    fireEvent.click(screen.getByTestId('pplBuilderSortColumn'));
    expect(screen.getByTestId('pplBuilderFieldOption-service')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderFieldOption-bytes')).toBeInTheDocument();
    expect(screen.queryByTestId('pplBuilderFieldOption-service.keyword')).not.toBeInTheDocument();
  });

  it('adds a descending sort on the first output column of an aggregated query', () => {
    const { onQueryChange } = renderBuilder({
      ...countState(),
      groupBy: { fields: ['service'] },
    });
    fireEvent.click(screen.getByTestId('pplBuilderAddSort'));
    expect(onQueryChange).toHaveBeenLastCalledWith(
      '| stats count() by service | sort -`count()`',
      expect.anything()
    );
  });

  it('renders a sort chip and removes the sort', () => {
    const { onQueryChange } = renderBuilder({
      ...countState(),
      groupBy: { fields: ['service'] },
      sort: { column: 'service', desc: false },
    });
    expect(screen.getByTestId('pplBuilderSortChip')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('pplBuilderRemoveSort'));
    expect(onQueryChange).toHaveBeenLastCalledWith('| stats count() by service', expect.anything());
  });
});
