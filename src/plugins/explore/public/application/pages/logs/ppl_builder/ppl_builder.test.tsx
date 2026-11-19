/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import type { SourceTypeVisualBuilder } from '../../../../services/source_type_registry';
import { createHistogramConfigs } from '../../../../components/chart/utils';
import { PPLBuilder } from './ppl_builder';
import { PPLBuilderState, emptyState } from './types';

// Render CodeEditor as a plain textbox so onChange is drivable; stub services the builder reads.
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  CodeEditor: ({
    value,
    onChange,
    languageId,
    suggestionProvider,
  }: {
    value: string;
    onChange: (value: string) => void;
    languageId?: string;
    suggestionProvider?: unknown;
  }) => (
    <input
      data-test-subj="pplBuilderSearchBoxInput"
      data-language-id={languageId}
      data-has-suggestions={String(!!suggestionProvider)}
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

// The time field as the data view reports it; a source can list one that isn't aggregatable.
const mockTimeField = { name: '@timestamp', type: 'date', aggregatable: true };
jest.mock('../../../context', () => ({
  useDatasetContext: () => ({
    dataset: {
      timeFieldName: '@timestamp',
      fields: { getByName: (name: string) => (name === '@timestamp' ? mockTimeField : undefined) },
    },
  }),
}));

jest.mock('./use_field_data', () => ({
  useFieldData: () => ({
    fields: [{ name: 'service' }, { name: 'bytes', type: 'number' }],
    fieldNames: ['service', 'bytes'],
    numericAndAggregatableNames: ['bytes'],
    numericFieldNames: ['bytes'],
    groupByFieldNames: ['service', 'bytes'],
    timeFieldName: '@timestamp',
    getFieldType: () => undefined,
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

  describe("with a source's own translation", () => {
    // A made-up language: `find <text> | stats <metrics> | order <column>`.
    const fakeLanguage: SourceTypeVisualBuilder = {
      build: jest.fn((state: PPLBuilderState) =>
        [
          `find ${state.searchExpression}`,
          ...state.aggregations.map((agg) => `stats ${agg.fn}(${agg.field ?? '*'})`),
          ...(state.sort ? [`order ${state.sort.column}`] : []),
        ].join(' | ')
      ),
      parse: () => ({ canBuild: false, state: emptyState() }),
      aggregationColumn: (agg) => `${agg.fn}(${agg.field ?? '*'})`,
      filterText: () => null,
      aggregations: ['count', 'avg'],
      filterOperators: ['is', 'is_not'],
    };

    const renderWithLanguage = (initialState: PPLBuilderState = emptyState()) => {
      const onQueryChange = jest.fn();
      render(
        <PPLBuilder
          initialState={initialState}
          language={fakeLanguage}
          onQueryChange={onQueryChange}
        />
      );
      return { onQueryChange };
    };

    it("writes the query in the translation's language", () => {
      const { onQueryChange } = renderWithLanguage();
      fireEvent.change(screen.getByTestId('pplBuilderSearchBoxInput'), {
        target: { value: 'error' },
      });
      expect(onQueryChange).toHaveBeenLastCalledWith('find error', expect.anything());
    });

    it("starts the metric group-by needs as the language's first aggregation without `count`", () => {
      const onQueryChange = jest.fn();
      render(
        <PPLBuilder
          initialState={emptyState()}
          language={{ ...fakeLanguage, aggregations: ['sum', 'avg'] }}
          onQueryChange={onQueryChange}
        />
      );
      fireEvent.click(screen.getByTestId('pplBuilderAddGroupBy'));
      const [, state] = onQueryChange.mock.calls[onQueryChange.mock.calls.length - 1];
      expect(state.aggregations).toEqual([expect.objectContaining({ fn: 'sum' })]);
    });

    it('offers only the aggregations the language supports', () => {
      renderWithLanguage();
      fireEvent.click(screen.getByTestId('pplBuilderAddAggregation'));
      expect(screen.getByTestId('pplBuilderAddAggregationOption-count')).toBeInTheDocument();
      expect(screen.getByTestId('pplBuilderAddAggregationOption-avg')).toBeInTheDocument();
      expect(screen.queryByTestId('pplBuilderAddAggregationOption-median')).not.toBeInTheDocument();
    });

    it('offers only the filter operators the language supports', () => {
      renderWithLanguage({
        ...emptyState(),
        filters: [{ id: 'f', field: 'service', operator: 'is', values: ['web'] }],
      });
      fireEvent.click(screen.getByTestId('pplBuilderFilterOperator-0'));
      expect(screen.getByTestId('pplBuilderFilterOperatorOption-is_not-0')).toBeInTheDocument();
      expect(
        screen.queryByTestId('pplBuilderFilterOperatorOption-is_one_of-0')
      ).not.toBeInTheDocument();
    });

    it('hides the function menu when the language lists no functions', () => {
      renderWithLanguage({
        ...emptyState(),
        aggregations: [{ id: 'a', fn: 'avg', field: 'bytes' }],
      });
      expect(screen.getByTestId('pplBuilderAgg-0')).toBeInTheDocument();
      expect(screen.queryByTestId('pplBuilderAddFn-0')).not.toBeInTheDocument();
    });

    it("sorts an aggregated query by the language's column for a metric", () => {
      const { onQueryChange } = renderWithLanguage(countState());
      fireEvent.click(screen.getByTestId('pplBuilderAddSort'));
      expect(onQueryChange).toHaveBeenLastCalledWith(
        'find  | stats count(*) | order count(*)',
        expect.anything()
      );
    });

    it("drops a sort on a metric's column once the metric is removed", () => {
      const { onQueryChange } = renderWithLanguage({
        ...countState(),
        sort: { column: 'count(*)', desc: true },
      });
      fireEvent.click(screen.getByTestId('pplBuilderRemoveAgg-0'));
      expect(onQueryChange).toHaveBeenLastCalledWith('find ', expect.anything());
    });

    it("makes the search box plain text, without PPL's autocomplete", () => {
      renderWithLanguage();
      const input = screen.getByTestId('pplBuilderSearchBoxInput');
      expect(input).toHaveAttribute('data-language-id', 'plaintext');
      expect(input).toHaveAttribute('data-has-suggestions', 'false');
    });
  });

  it("keeps PPL's search autocomplete by default", () => {
    renderBuilder();
    const input = screen.getByTestId('pplBuilderSearchBoxInput');
    expect(input).toHaveAttribute('data-language-id', 'pplSearchExpression');
    expect(input).toHaveAttribute('data-has-suggestions', 'true');
  });

  it("defaults the time interval without a histogram config when the time field can't aggregate", () => {
    mockTimeField.aggregatable = false;
    (createHistogramConfigs as jest.Mock).mockClear();
    try {
      const { onQueryChange } = renderBuilder(countState());
      fireEvent.click(screen.getByTestId('pplBuilderAddGroupBy'));
      fireEvent.click(screen.getByTestId('pplBuilderGroupByFields'));
      fireEvent.click(screen.getByTestId('pplBuilderGroupByOverTime'));
      // The config would reject the field with an error toast, so it's never built.
      expect(createHistogramConfigs).not.toHaveBeenCalled();
      expect(onQueryChange).toHaveBeenLastCalledWith(
        '| stats count() by span(@timestamp, 1m)',
        expect.anything()
      );
    } finally {
      mockTimeField.aggregatable = true;
    }
  });
});
