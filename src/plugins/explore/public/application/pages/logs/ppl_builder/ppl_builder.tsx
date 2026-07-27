/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './ppl_builder.scss';

import React, { useCallback, useMemo, useReducer, useRef, useState, useEffect } from 'react';
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
import { ControlGroup, GhostAddButton } from '../../../components/query_builder';

interface PPLBuilderProps {
  initialState?: PPLBuilderState;
  onQueryChange: (query: string, state: PPLBuilderState) => void;
  onSwitchToCode?: () => void;
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
    numericAndAggregatableNames,
    numericFieldNames,
    groupByFieldNames,
    timeFieldName,
    getFieldType,
    getValues,
  } = useFieldData();

  const deriveAutoInterval = useCallback((): string => {
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

  const autoInterval = useMemo(() => deriveAutoInterval(), [deriveAutoInterval]);

  const query = useMemo(() => buildPPL(state, getFieldType), [state, getFieldType]);

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

  const [showGroupBy, setShowGroupBy] = useState(
    () => !!(initialState && (initialState.groupBy.fields.length > 0 || initialState.groupBy.span))
  );
  // Auto-focus the field picker only when group-by is revealed by a click, not when seeded.
  const [autoOpenGroupBy, setAutoOpenGroupBy] = useState(false);

  const expandGroupBy = useCallback(() => {
    if (state.aggregations.length === 0) {
      dispatch({ type: 'ADD_AGGREGATION' });
    }
    setShowGroupBy(true);
    setAutoOpenGroupBy(true);
  }, [state.aggregations.length]);

  // Group-by requires an aggregation; collapse and reset it once the last one is removed.
  useEffect(() => {
    if (!hasAggregation) {
      setShowGroupBy(false);
      setAutoOpenGroupBy(false);
      dispatch({ type: 'RESET_GROUPBY' });
    }
  }, [hasAggregation]);

  const sortColumns = useMemo(
    () => (hasAggregation ? sortableColumns(state) : fieldNames),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasAggregation, state.aggregations, state.groupBy.fields, fieldNames]
  );

  const addSpan = () => {
    dispatch({
      type: 'SET_SPAN',
      span: { field: timeFieldName, interval: deriveAutoInterval(), auto: true },
    });
  };

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
          getFieldType={getFieldType}
          getValues={getValues}
          dispatch={dispatch}
        />

        {hasAggregation ? (
          <ControlGroup
            className="plqGroup--wrap"
            label={i18n.translate('explore.pplBuilder.aggregations', {
              defaultMessage: 'Aggregations',
            })}
            dataTestSubj="pplBuilderStats"
          >
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
              hasMetrics
              onAdd={(fn) => dispatch({ type: 'ADD_AGGREGATION', agg: { fn } })}
              dataTestSubj="pplBuilderAddAggregation"
            />
          </ControlGroup>
        ) : (
          <AddMetricMenu
            onAdd={(fn) => dispatch({ type: 'ADD_AGGREGATION', agg: { fn } })}
            dataTestSubj="pplBuilderAddAggregation"
          />
        )}

        {showGroupBy ? (
          <GroupByRow
            groupBy={state.groupBy}
            options={groupByFieldNames}
            timeFieldName={timeFieldName}
            autoInterval={autoInterval}
            onAddSpan={addSpan}
            autoOpen={autoOpenGroupBy}
            dispatch={dispatch}
          />
        ) : (
          <GhostAddButton
            label={i18n.translate('explore.pplBuilder.addGroupBy', { defaultMessage: 'Group by' })}
            onClick={expandGroupBy}
            dataTestSubj="pplBuilderAddGroupBy"
          />
        )}

        <span className="plqSpacer" />
        <span className="plqDivider" />
        <SortRow sort={state.sort} columns={sortColumns} dispatch={dispatch} />
      </div>
    </div>
  );
};
