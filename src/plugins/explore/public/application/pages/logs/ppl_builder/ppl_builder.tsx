/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './ppl_builder.scss';

import React, { useCallback, useMemo, useReducer, useRef, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { createHistogramConfigs } from '../../../../components/chart/utils';
import { builderReducer, buildPPL, sortableColumns } from './build_ppl';
import { PPLBuilderState, emptyState } from './types';
import { SearchBox } from './search_box';
import { AggregationRow } from './aggregation_row';
import { SortRow } from './sort_row';
import { GroupByRow } from './group_by_row';
import { WhereRow } from './where_row';
import { AddMetricMenu } from './add_metric_menu';
import { ModeToggleButton } from './mode_toggle_button';
import { useFieldData } from './use_field_data';
import { useDatasetContext } from '../../../context';

interface PPLBuilderProps {
  initialState?: PPLBuilderState;
  onQueryChange: (query: string, state: PPLBuilderState) => void;
  /** Switch to code mode (the `</>` toggle in the search row). */
  onSwitchToCode?: () => void;
  /** Execute the query (Cmd/Ctrl+Enter), mirroring the code-mode editor. */
  onRun?: () => void;
}

const CHART_BAR_TARGET = 15;

export const PPLBuilder: React.FC<PPLBuilderProps> = ({
  initialState,
  onQueryChange,
  onSwitchToCode,
  onRun,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { dataset } = useDatasetContext();
  const [state, dispatch] = useReducer(
    builderReducer,
    initialState ?? null,
    (seed) => seed ?? emptyState()
  );
  const {
    fieldNames,
    sortableFieldNames,
    numericAndAggregatableNames,
    numericFieldNames,
    groupByFieldNames,
    timeFieldName,
    getValues,
  } = useFieldData();

  const deriveAutoInterval = useCallback((): string => {
    // Use the fully-resolved DataView (with timeFieldName + fields) so
    // createAggConfigs succeeds and the interval actually adapts to the range.
    // The lightweight queryString descriptor lacks these and forces the fallback.
    if (!dataset?.timeFieldName) return '1m';
    try {
      const configs = createHistogramConfigs(
        dataset,
        'auto',
        services.data,
        services.uiSettings,
        undefined,
        CHART_BAR_TARGET
      );
      const bucketAgg = configs?.aggs?.[1] as any;
      return bucketAgg?.buckets?.getInterval?.()?.expression || '1m';
    } catch {
      return '1m';
    }
  }, [services, dataset]);

  // Memoized for the cosmetic "every {interval}" hint/tooltip so typing in the
  // search box doesn't rebuild the histogram configs on every keystroke. The
  // live `addSpan` path still calls deriveAutoInterval() to capture the current
  // time range at click time.
  const autoInterval = useMemo(() => deriveAutoInterval(), [deriveAutoInterval]);

  // The builder emits a source-less query (just the search expression + stats).
  // The `source = <index>` clause is the dataset's concern — hidden from the UI
  // and prepended by the execution layer when the query runs.
  const query = useMemo(() => buildPPL(state), [state]);

  const onQueryChangeRef = useRef(onQueryChange);
  onQueryChangeRef.current = onQueryChange;
  useEffect(() => {
    onQueryChangeRef.current(query, state);
  }, [query, state]);

  const onSearchChange = useCallback(
    (text: string) => {
      dispatch({ type: 'SET_SEARCH_EXPRESSION', searchExpression: text });
    },
    [dispatch]
  );

  const hasAggregation = state.aggregations.length > 0;

  // Candidate sort columns. When the query aggregates, sort targets an output
  // column (metrics + group-by fields, via `sortableColumns`); otherwise sort
  // applies to raw rows, so offer the dataset's sortable fields (excluding
  // `.keyword` multi-fields, which the PPL engine rejects as a sort target).
  // Recomputed from state so it tracks metric/group-by edits.
  const sortColumns = useMemo(
    () => (hasAggregation ? sortableColumns(state) : sortableFieldNames),
    // sortableColumns reads only aggregations + group-by fields, so recompute
    // when those change — not on unrelated state edits (e.g. search keystrokes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasAggregation, state.aggregations, state.groupBy.fields, sortableFieldNames]
  );

  const addSpan = () => {
    dispatch({
      type: 'SET_SPAN',
      span: { field: timeFieldName, interval: deriveAutoInterval(), auto: true },
    });
  };

  // Cmd/Ctrl+Enter runs the query from anywhere in the builder — the Monaco
  // search box binds it as an editor action, but the EUI form controls
  // (comboboxes, buttons) need this root-level handler to catch the same
  // shortcut. Mirrors the code-mode editor's run keybinding.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onRun?.();
      }
    },
    [onRun]
  );

  return (
    <div className="plqBuilder" data-test-subj="pplBuilder" onKeyDown={onKeyDown}>
      <div className="plqRow">
        <span className="plqRow__label">
          {i18n.translate('explore.pplBuilder.searchFor', { defaultMessage: 'Search for' })}
        </span>
        <div className="plqSearchBoxWrap">
          <SearchBox
            value={state.searchExpression}
            fieldNames={fieldNames}
            onRequestValues={getValues}
            onChange={onSearchChange}
            onRun={onRun}
          />
        </div>
        {onSwitchToCode && <ModeToggleButton isCode={false} onToggle={onSwitchToCode} />}
      </div>

      <div className="plqRow plqRow--builder">
        <WhereRow
          filters={state.filters}
          fieldNames={fieldNames}
          getValues={getValues}
          dispatch={dispatch}
        />

        <span className="plqDivider" />

        <span className="plqRow__label">
          {i18n.translate('explore.pplBuilder.groupInto', { defaultMessage: 'Group into' })}
        </span>

        {state.aggregations.map((agg, idx) => (
          <AggregationRow
            key={agg.id}
            agg={agg}
            idx={idx}
            numericFieldOptions={numericFieldNames}
            anyFieldOptions={numericAndAggregatableNames}
            dispatch={dispatch}
          />
        ))}

        <AddMetricMenu
          hasMetrics={hasAggregation}
          onAdd={(fn) => dispatch({ type: 'ADD_AGGREGATION', agg: { fn } })}
          dataTestSubj="pplBuilderAddAggregation"
        />

        {hasAggregation && (
          <GroupByRow
            groupBy={state.groupBy}
            options={groupByFieldNames}
            timeFieldName={timeFieldName}
            autoInterval={autoInterval}
            onAddSpan={addSpan}
            dispatch={dispatch}
          />
        )}

        <span className="plqSpacer" />
        <span className="plqDivider" />
        <SortRow sort={state.sort} columns={sortColumns} dispatch={dispatch} />
      </div>
    </div>
  );
};
