/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './promql_builder.scss';

import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiSpacer,
  EuiCode,
} from '@elastic/eui';
import { PrometheusClient } from '../explore/services/prometheus_client';
import { BuilderState } from './promql_parser';
import { builderReducer, buildPromQL, emptyFilter } from './build_promql';
import { getOperationSiblings } from './operation_lookup';
import { OperationPill } from './operation_pill';
import { withConnector } from './tree_connector';
import { comboBoxWidth, inputWidth } from './measure_text';
import { useMetricData } from './use_metric_data';
import { LabelFilterRow } from './label_filter_row';
import { LabelBadges } from './label_badges';
import { OpsMenu } from './ops_menu';

interface PromQLBuilderProps {
  client: PrometheusClient;
  onQueryChange: (query: string) => void;
  initialState?: BuilderState;
}

export const PromQLBuilder: React.FC<PromQLBuilderProps> = ({
  client,
  onQueryChange,
  initialState,
}) => {
  const [state, dispatch] = useReducer(
    builderReducer,
    initialState || { metric: '', labelFilters: [emptyFilter()], operations: [] }
  );

  const {
    metricOptions,
    metricSearchLoading,
    labelOptions,
    labelValueOptions,
    labelCardinality,
    onMetricFocus,
    onMetricSearchChange,
    loadLabelValues,
  } = useMetricData(client, state.metric);

  const prevQueryRef = useRef('');

  useEffect(() => {
    const query = buildPromQL(state);
    if (query !== prevQueryRef.current) {
      prevQueryRef.current = query;
      onQueryChange(query);
    }
  }, [state, onQueryChange]);

  const reversedOps = useMemo(() => [...state.operations].reverse(), [state.operations]);

  const metricRow = (
    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
      <EuiFlexItem grow={false}>
        <div className="pqbGroup">
          <span className="pqbGroup__label">
            {i18n.translate('explore.promqlBuilder.metric', { defaultMessage: 'Metric' })}
          </span>
          <EuiComboBox
            compressed
            singleSelection={{ asPlainText: true }}
            placeholder={i18n.translate('explore.promqlBuilder.selectMetric', {
              defaultMessage: 'Select metric name',
            })}
            options={metricOptions}
            selectedOptions={state.metric ? [{ label: state.metric }] : []}
            onChange={(selected) =>
              dispatch({ type: 'SET_METRIC', metric: selected[0]?.label || '' })
            }
            onCreateOption={(val) => {
              const v = val.trim();
              if (v) dispatch({ type: 'SET_METRIC', metric: v });
            }}
            onFocus={onMetricFocus}
            onSearchChange={onMetricSearchChange}
            isLoading={metricSearchLoading}
            async
            style={{ width: comboBoxWidth(state.metric || 'Select metric name') }}
            data-test-subj="promqlBuilderMetricSelect"
          />
        </div>
      </EuiFlexItem>
      {state.labelFilters.map((filter, idx) => (
        <LabelFilterRow
          key={idx}
          filter={filter}
          idx={idx}
          labelOptions={labelOptions}
          labelValueOptions={labelValueOptions[filter.label] || []}
          canRemove={state.labelFilters.length > 1}
          dispatch={dispatch}
          loadLabelValues={loadLabelValues}
        />
      ))}
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          iconType="plusInCircle"
          aria-label={i18n.translate('explore.promqlBuilder.addFilter', {
            defaultMessage: 'Add filter',
          })}
          size="s"
          onClick={() => dispatch({ type: 'ADD_LABEL_FILTER' })}
        />
      </EuiFlexItem>
      {state.range !== undefined && (
        <EuiFlexItem grow={false}>
          <div className="pqbGroup">
            <span className="pqbGroup__label">
              {i18n.translate('explore.promqlBuilder.range', { defaultMessage: 'Range' })}
            </span>
            <input
              value={state.range}
              placeholder="5m"
              onChange={(e) => dispatch({ type: 'SET_RANGE', range: e.target.value })}
              className="pqbParamInput"
              style={{ width: inputWidth(state.range || '5m') }}
            />
            <div className="pqbSep" />
            <EuiButtonIcon
              iconType="cross"
              size="s"
              color="text"
              aria-label={i18n.translate('explore.promqlBuilder.removeRange', {
                defaultMessage: 'Remove range',
              })}
              onClick={() => dispatch({ type: 'REMOVE_RANGE' })}
            />
          </div>
        </EuiFlexItem>
      )}
      <OpsMenu hasRange={state.range !== undefined} dispatch={dispatch} />
      <LabelBadges
        metric={state.metric}
        labelCardinality={labelCardinality}
        labelFilters={state.labelFilters}
        client={client}
        dispatch={dispatch}
      />
    </EuiFlexGroup>
  );

  return (
    <div className="pqbBuilder">
      {reversedOps.map((op, revIdx) => {
        const stateIdx = state.operations.length - 1 - revIdx;
        const pill = (
          <OperationPill
            op={op}
            idx={stateIdx}
            dispatch={dispatch}
            labelOptions={labelOptions}
            getOperationSiblings={getOperationSiblings}
            hasRange={state.range !== undefined}
          />
        );
        return (
          <React.Fragment key={stateIdx}>
            {revIdx === 0 ? pill : withConnector(revIdx - 1, pill, true)}
          </React.Fragment>
        );
      })}

      {state.operations.length > 0
        ? withConnector(state.operations.length - 1, metricRow, true, 16)
        : metricRow}

      <EuiSpacer size="s" />
      <EuiCode language="promql" transparentBackground className="pqbQueryPreview">
        {buildPromQL(state) ||
          i18n.translate('explore.promqlBuilder.queryPreviewPlaceholder', {
            defaultMessage: 'Select a metric to start.',
          })}
      </EuiCode>
    </div>
  );
};
