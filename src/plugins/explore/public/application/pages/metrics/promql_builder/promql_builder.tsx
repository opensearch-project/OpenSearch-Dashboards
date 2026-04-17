/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './promql_builder.scss';

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiText,
  EuiSpacer,
  EuiContextMenu,
  EuiPopover,
  EuiToolTip,
  EuiBadge,
  EuiCode,
  EuiSuperSelect,
} from '@elastic/eui';
import { PrometheusClient } from '../explore/services/prometheus_client';
import { BuilderState } from './promql_parser';
import { builderReducer, buildPromQL, emptyFilter } from './build_promql';
import { OPERATION_CATEGORIES, OPERATORS, getOperationSiblings } from './operation_categories';
import { OperationPill } from './operation_pill';
import { withConnector } from './tree_connector';
import { comboBoxWidth, inputWidth } from './measure_text';

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
    initialState || {
      metric: '',
      labelFilters: [emptyFilter()],
      operations: [],
    }
  );

  const [metricOptions, setMetricOptions] = useState<EuiComboBoxOptionOption[]>([]);
  const [metricSearchLoading, setMetricSearchLoading] = useState(false);
  const [labelOptions, setLabelOptions] = useState<EuiComboBoxOptionOption[]>([]);
  const [labelValueOptions, setLabelValueOptions] = useState<
    Record<string, EuiComboBoxOptionOption[]>
  >({});
  const [opsPopoverOpen, setOpsPopoverOpen] = useState(false);
  const [labelCardinality, setLabelCardinality] = useState<Record<string, number>>({});
  const [labelPopover, setLabelPopover] = useState<string | null>(null);
  const [labelPopoverValues, setLabelPopoverValues] = useState<string[]>([]);
  const [labelsExpanded, setLabelsExpanded] = useState(false);

  const prevQueryRef = useRef('');
  const metricSearchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const metricNamesLoadedRef = useRef(false);

  // Sync generated query to parent
  useEffect(() => {
    const query = buildPromQL(state);
    if (query !== prevQueryRef.current) {
      prevQueryRef.current = query;
      onQueryChange(query);
    }
  }, [state, onQueryChange]);

  const onMetricFocus = useCallback(() => {
    if (metricNamesLoadedRef.current || metricOptions.length > 0) return;
    metricNamesLoadedRef.current = true;
    setMetricSearchLoading(true);
    client
      .getMetricNames()
      .then((names) => setMetricOptions(names.slice(0, 100).map((n) => ({ label: n }))))
      .catch(() => {})
      .finally(() => setMetricSearchLoading(false));
  }, [client, metricOptions.length]);

  const onMetricSearchChange = useCallback(
    (searchValue: string) => {
      clearTimeout(metricSearchTimerRef.current);
      setMetricSearchLoading(false);
      if (searchValue.length < 2) {
        if (metricNamesLoadedRef.current) {
          client
            .getMetricNames()
            .then((names) => setMetricOptions(names.slice(0, 100).map((n) => ({ label: n }))))
            .catch(() => {});
        }
        return;
      }
      setMetricSearchLoading(true);
      metricSearchTimerRef.current = setTimeout(() => {
        client
          .searchMetricNames(searchValue)
          .then((names) => setMetricOptions(names.slice(0, 100).map((n) => ({ label: n }))))
          .catch(() => setMetricOptions([]))
          .finally(() => setMetricSearchLoading(false));
      }, 200);
    },
    [client]
  );

  // Fetch label names and derive cardinality from a single getSeries call
  useEffect(() => {
    if (!state.metric) {
      setLabelOptions([]);
      setLabelCardinality({});
      return;
    }
    let cancelled = false;
    Promise.all([
      client.getLabelsForMetric(state.metric),
      client.getSeries(`{__name__="${state.metric}"}`),
    ])
      .then(([labels, series]) => {
        if (cancelled) return;
        setLabelOptions(labels.map((l) => ({ label: l })));

        const valueSets: Record<string, Set<string>> = {};
        for (const s of series) {
          for (const [key, value] of Object.entries(s)) {
            if (key === '__name__') continue;
            if (!valueSets[key]) valueSets[key] = new Set();
            valueSets[key].add(value);
          }
        }
        const cardinality: Record<string, number> = {};
        for (const label of labels) {
          cardinality[label] = valueSets[label]?.size ?? 0;
        }
        setLabelCardinality(cardinality);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client, state.metric]);

  const loadLabelValues = useCallback(
    (labelName: string) => {
      if (!labelName || labelValueOptions[labelName]) return;
      client
        .getLabelValues(labelName, state.metric)
        .then((values) => {
          setLabelValueOptions((prev) => ({
            ...prev,
            [labelName]: values.map((v) => ({ label: v })),
          }));
        })
        .catch(() => {});
    },
    [client, state.metric, labelValueOptions]
  );

  const onLabelBadgeClick = useCallback(
    (labelName: string) => {
      setLabelPopover(labelName);
      client
        .getLabelValues(labelName, state.metric)
        .then((values) => setLabelPopoverValues(values))
        .catch(() => setLabelPopoverValues([]));
    },
    [client, state.metric]
  );

  const addAggregationByLabel = useCallback((aggId: string, aggName: string, labelName: string) => {
    dispatch({
      type: 'ADD_OPERATION',
      operation: {
        id: aggId,
        name: aggName,
        params: [],
        grouping:
          aggId === 'group'
            ? { mode: 'without', labels: [labelName] }
            : { mode: 'by', labels: [labelName] },
      },
    });
    setLabelPopover(null);
  }, []);

  const opsMenuPanels = useMemo(
    () => [
      {
        id: 0,
        items: [
          ...(state.range === undefined
            ? [
                {
                  name: 'Add range',
                  onClick: () => {
                    dispatch({ type: 'SET_RANGE', range: '5m' });
                    setOpsPopoverOpen(false);
                  },
                },
              ]
            : []),
          ...OPERATION_CATEGORIES.map((cat, i) => ({
            name: cat.name,
            panel: i + 1,
          })),
        ],
      },
      ...OPERATION_CATEGORIES.map((cat, i) => ({
        id: i + 1,
        title: cat.name,
        items: cat.items.map((item) => ({
          name: (
            <div>
              <strong>{item.name}</strong>
              <EuiText size="xs" color="subdued" className="pqbOpsMenuDescription">
                {item.description}
              </EuiText>
            </div>
          ),
          onClick: () => {
            dispatch({
              type: 'ADD_OPERATION',
              operation: { id: item.id, name: item.name, params: [...item.params] },
            });
            setOpsPopoverOpen(false);
          },
        })),
      })),
    ],
    [state.range]
  );

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
        <React.Fragment key={idx}>
          <EuiFlexItem grow={false}>
            <div className="pqbGroup">
              <span className="pqbGroup__label">
                {i18n.translate('explore.promqlBuilder.label', { defaultMessage: 'Label' })}
              </span>
              <EuiComboBox
                compressed
                singleSelection={{ asPlainText: true }}
                isClearable={false}
                placeholder={i18n.translate('explore.promqlBuilder.labelName', {
                  defaultMessage: 'Label name',
                })}
                options={labelOptions}
                selectedOptions={filter.label ? [{ label: filter.label }] : []}
                onChange={(selected) => {
                  const labelName = selected[0]?.label || '';
                  dispatch({
                    type: 'SET_LABEL_FILTER',
                    index: idx,
                    filter: { label: labelName, value: '' },
                  });
                  if (labelName) loadLabelValues(labelName);
                }}
                onCreateOption={(val) => {
                  const labelName = val.trim();
                  if (labelName) {
                    dispatch({
                      type: 'SET_LABEL_FILTER',
                      index: idx,
                      filter: { label: labelName, value: '' },
                    });
                    loadLabelValues(labelName);
                  }
                }}
                className="pqbCombo--labelName"
                style={{ width: comboBoxWidth(filter.label || 'Label name'), flex: '0 0 auto' }}
              />
              <div className="pqbSep" />
              <EuiSuperSelect
                compressed
                options={OPERATORS.map((op) => ({ value: op, inputDisplay: op }))}
                valueOfSelected={filter.op}
                onChange={(value) =>
                  dispatch({
                    type: 'SET_LABEL_FILTER',
                    index: idx,
                    filter: { op: value },
                  })
                }
                style={{ width: 70 }}
              />
              <div className="pqbSep" />
              <EuiComboBox
                compressed
                singleSelection={{ asPlainText: true }}
                isClearable={false}
                placeholder={i18n.translate('explore.promqlBuilder.labelValue', {
                  defaultMessage: 'Label value',
                })}
                options={labelValueOptions[filter.label] || []}
                selectedOptions={filter.value ? [{ label: filter.value }] : []}
                onChange={(selected) =>
                  dispatch({
                    type: 'SET_LABEL_FILTER',
                    index: idx,
                    filter: { value: selected[0]?.label || '' },
                  })
                }
                onCreateOption={(val) => {
                  const v = val.trim();
                  if (v) dispatch({ type: 'SET_LABEL_FILTER', index: idx, filter: { value: v } });
                }}
                onFocus={() => {
                  if (filter.label) loadLabelValues(filter.label);
                }}
                className="pqbCombo--labelValue"
                style={{ width: comboBoxWidth(filter.value || 'Label value'), flex: '0 0 auto' }}
              />
              <div className="pqbSep" />
              <EuiButtonIcon
                iconType="cross"
                color="text"
                aria-label={i18n.translate('explore.promqlBuilder.removeFilter', {
                  defaultMessage: 'Remove filter',
                })}
                size="s"
                onClick={() =>
                  state.labelFilters.length <= 1
                    ? dispatch({
                        type: 'SET_LABEL_FILTER',
                        index: idx,
                        filter: { label: '', op: '=', value: '' },
                      })
                    : dispatch({ type: 'REMOVE_LABEL_FILTER', index: idx })
                }
              />
            </div>
          </EuiFlexItem>
        </React.Fragment>
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
      <EuiFlexItem grow={false}>
        <EuiPopover
          button={
            <EuiButtonIcon
              iconType="boxesVertical"
              aria-label={i18n.translate('explore.promqlBuilder.addOperation', {
                defaultMessage: 'Add operation',
              })}
              size="s"
              onClick={() => setOpsPopoverOpen(!opsPopoverOpen)}
            />
          }
          isOpen={opsPopoverOpen}
          closePopover={() => setOpsPopoverOpen(false)}
          panelPaddingSize="none"
          panelClassName="pqbOpsMenuPanel"
          anchorPosition="downRight"
        >
          <EuiContextMenu initialPanelId={0} panels={opsMenuPanels} size="s" />
        </EuiPopover>
      </EuiFlexItem>
      {state.metric &&
        Object.keys(labelCardinality).length > 0 &&
        (() => {
          const labels = Object.entries(labelCardinality);
          const MAX_VISIBLE = 3;
          const visible = labelsExpanded ? labels : labels.slice(0, MAX_VISIBLE);
          const overflow = labels.length - MAX_VISIBLE;
          return (
            <>
              {visible.map(([label, count]) => (
                <EuiFlexItem grow={false} key={label}>
                  <EuiPopover
                    button={
                      <EuiBadge
                        color="hollow"
                        onClick={() => onLabelBadgeClick(label)}
                        onClickAriaLabel={`Show values for ${label}`}
                      >
                        {label} ({count})
                      </EuiBadge>
                    }
                    isOpen={labelPopover === label}
                    closePopover={() => setLabelPopover(null)}
                    panelPaddingSize="s"
                    anchorPosition="downCenter"
                  >
                    <div className="pqbLabelPopover">
                      <EuiText size="s">
                        <strong>{label}</strong>
                      </EuiText>
                      <EuiSpacer size="xs" />
                      <div className="pqbLabelPopoverValues">
                        {labelPopoverValues.map((v) => (
                          <div key={v} className="pqbLabelValueRow">
                            <EuiText size="xs">{v}</EuiText>
                            <EuiButtonIcon
                              iconType="plusInCircle"
                              size="s"
                              aria-label={`Add ${label}=${v} filter`}
                              onClick={() => {
                                dispatch({ type: 'ADD_LABEL_FILTER' });
                                const filterIdx = state.labelFilters.length;
                                setTimeout(() => {
                                  dispatch({
                                    type: 'SET_LABEL_FILTER',
                                    index: filterIdx,
                                    filter: { label, value: v },
                                  });
                                }, 0);
                                setLabelPopover(null);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <EuiSpacer size="xs" />
                      <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                        {[
                          { id: 'sum', label: 'Sum by' },
                          { id: 'count', label: 'Count by' },
                          { id: 'avg', label: 'Avg by' },
                          { id: 'max', label: 'Max by' },
                        ].map((agg) => (
                          <EuiFlexItem grow={false} key={agg.id}>
                            <EuiButtonEmpty
                              size="xs"
                              iconType="tableDensityNormal"
                              onClick={() => addAggregationByLabel(agg.id, agg.id, label)}
                            >
                              {agg.label}
                            </EuiButtonEmpty>
                          </EuiFlexItem>
                        ))}
                      </EuiFlexGroup>
                      <EuiSpacer size="xs" />
                      <EuiButtonEmpty
                        size="xs"
                        iconType="cross"
                        onClick={() => addAggregationByLabel('group', 'group', label)}
                      >
                        {i18n.translate('explore.promqlBuilder.groupWithout', {
                          defaultMessage: 'Group without',
                        })}
                      </EuiButtonEmpty>
                    </div>
                  </EuiPopover>
                </EuiFlexItem>
              ))}
              {overflow > 0 && !labelsExpanded && (
                <EuiFlexItem grow={false}>
                  <EuiToolTip
                    content={labels
                      .slice(MAX_VISIBLE)
                      .map(([l]) => l)
                      .join(', ')}
                  >
                    <EuiBadge
                      color="hollow"
                      onClick={() => setLabelsExpanded(true)}
                      onClickAriaLabel={`Show ${overflow} more labels`}
                    >
                      (+{overflow})
                    </EuiBadge>
                  </EuiToolTip>
                </EuiFlexItem>
              )}
              {labelsExpanded && overflow > 0 && (
                <EuiFlexItem grow={false}>
                  <EuiBadge
                    color="hollow"
                    iconType="minimize"
                    iconSide="right"
                    onClick={() => setLabelsExpanded(false)}
                    onClickAriaLabel="Collapse labels"
                  />
                </EuiFlexItem>
              )}
            </>
          );
        })()}
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
      <EuiCode language="promql" transparentBackground style={{ fontSize: 12 }}>
        {buildPromQL(state) ||
          i18n.translate('explore.promqlBuilder.queryPreviewPlaceholder', {
            defaultMessage: 'Select a metric to start.',
          })}
      </EuiCode>
    </div>
  );
};
