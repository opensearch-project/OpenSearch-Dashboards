/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiBadge,
  EuiPopover,
  EuiSmallButtonEmpty,
  EuiIcon,
  EuiFormRow,
  EuiSuperSelect,
} from '@elastic/eui';
import { LabelFilter } from './types';
import { PrometheusClient } from './prometheus_client';
import { useExploration } from './exploration_context';

const OPERATORS: Array<{
  value: LabelFilter['operator'];
  inputDisplay: string;
  dropdownDisplay: React.ReactNode;
}> = [
  {
    value: '=',
    inputDisplay: '=',
    dropdownDisplay: (
      <>
        <strong>=</strong>
        <br />
        <small>Equals</small>
      </>
    ),
  },
  {
    value: '!=',
    inputDisplay: '!=',
    dropdownDisplay: (
      <>
        <strong>!=</strong>
        <br />
        <small>Not equal</small>
      </>
    ),
  },
  {
    value: '=~',
    inputDisplay: '=~',
    dropdownDisplay: (
      <>
        <strong>=~</strong>
        <br />
        <small>Matches regex</small>
      </>
    ),
  },
  {
    value: '!~',
    inputDisplay: '!~',
    dropdownDisplay: (
      <>
        <strong>!~</strong>
        <br />
        <small>Does not match regex</small>
      </>
    ),
  },
];

interface LabelFilterPopoverProps {
  labelNames: string[];
  loadValues: (name: string) => void;
  valueOptions: EuiComboBoxOptionOption[];
  onAdd: (filter: LabelFilter) => void;
}

export const LabelFilterPopover: React.FC<LabelFilterPopoverProps> = ({
  labelNames,
  loadValues,
  valueOptions,
  onAdd,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftOp, setDraftOp] = useState<LabelFilter['operator']>('=');

  return (
    <EuiPopover
      isOpen={isOpen}
      closePopover={() => {
        setIsOpen(false);
        setDraftName('');
      }}
      button={
        <EuiSmallButtonEmpty
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Add label filter"
          data-test-subj="addLabelFilter"
        >
          Label
          <EuiIcon type="filter" style={{ marginLeft: 4 }} />
        </EuiSmallButtonEmpty>
      }
      anchorPosition="downLeft"
      panelPaddingSize="s"
    >
      <EuiFlexGroup gutterSize="s" direction="column" style={{ width: 260 }}>
        <EuiFlexItem>
          <EuiFormRow label="Label" compressed>
            <EuiComboBox
              placeholder="Select label..."
              singleSelection={{ asPlainText: true }}
              options={labelNames.map((n) => ({ label: n }))}
              selectedOptions={draftName ? [{ label: draftName }] : []}
              onChange={(sel) => {
                const name = sel[0]?.label || '';
                setDraftName(name);
                if (name) loadValues(name);
              }}
              onCreateOption={(val) => {
                const name = val.trim();
                if (name) {
                  setDraftName(name);
                  loadValues(name);
                }
              }}
              isClearable
              compressed
            />
          </EuiFormRow>
        </EuiFlexItem>
        {draftName && (
          <EuiFlexItem>
            <EuiFormRow label="Operator" compressed>
              <EuiSuperSelect
                options={OPERATORS}
                valueOfSelected={draftOp}
                onChange={(val) => setDraftOp(val as LabelFilter['operator'])}
                compressed
              />
            </EuiFormRow>
          </EuiFlexItem>
        )}
        {draftName && (
          <EuiFlexItem>
            <EuiFormRow label="Value" compressed>
              <EuiComboBox
                placeholder={`${draftName}${draftOp}...`}
                singleSelection={{ asPlainText: true }}
                options={valueOptions}
                onChange={(sel) => {
                  if (sel[0]) {
                    onAdd({ name: draftName, operator: draftOp, value: sel[0].label });
                    setDraftName('');
                    setDraftOp('=');
                    setIsOpen(false);
                  }
                }}
                onCreateOption={(val) => {
                  const v = val.trim();
                  if (v) {
                    onAdd({ name: draftName, operator: draftOp, value: v });
                    setDraftName('');
                    setDraftOp('=');
                    setIsOpen(false);
                  }
                }}
                compressed
              />
            </EuiFormRow>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </EuiPopover>
  );
};

interface LabelFilterBarProps {
  metric: string;
  filters: LabelFilter[];
  client: PrometheusClient;
  onAdd: (filter: LabelFilter) => void;
  onRemove: (index: number) => void;
  onToggle?: (index: number) => void;
  onClear: () => void;
}

export const LabelFilterBar: React.FC<LabelFilterBarProps> = ({
  metric,
  filters,
  client,
  onAdd,
  onRemove,
  onToggle,
  onClear,
}) => {
  const [labelNames, setLabelNames] = useState<string[]>([]);
  const [valueOptions, setValueOptions] = useState<Record<string, EuiComboBoxOptionOption[]>>({});
  const [activeName, setActiveName] = useState('');

  useEffect(() => {
    if (!metric) return;
    let cancelled = false;
    client
      .getLabelsForMetric(metric)
      .then((names) => {
        if (!cancelled) setLabelNames(names);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client, metric]);

  const loadValues = useCallback(
    (name: string) => {
      setActiveName(name);
      if (!name || valueOptions[name]) return;
      client
        .getLabelValues(name, metric)
        .then((vals) => {
          setValueOptions((prev) => ({ ...prev, [name]: vals.map((v) => ({ label: v })) }));
        })
        .catch(() => {});
    },
    [client, metric, valueOptions]
  );

  return (
    <EuiFlexGroup gutterSize="xs" alignItems="center" wrap responsive={false}>
      {filters.map((f, i) => (
        <EuiFlexItem grow={false} key={i}>
          <EuiBadge
            color={f.enabled === false ? 'default' : 'hollow'}
            iconType="cross"
            iconSide="right"
            iconOnClick={() => onRemove(i)}
            iconOnClickAriaLabel={`Remove ${f.name}${f.operator}${f.value}`}
            onClick={() => onToggle?.(i)}
            onClickAriaLabel={`Toggle ${f.name}${f.operator}${f.value}`}
            style={f.enabled === false ? { opacity: 0.5, textDecoration: 'line-through' } : {}}
          >
            {f.name}
            {f.operator}&quot;{f.value}&quot;
          </EuiBadge>
        </EuiFlexItem>
      ))}
      <EuiFlexItem grow={false}>
        <LabelFilterPopover
          labelNames={labelNames}
          loadValues={loadValues}
          valueOptions={valueOptions[activeName] || []}
          onAdd={onAdd}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const LabelFilterBadges: React.FC = () => {
  const { state, dispatch } = useExploration();
  if (state.filters.length === 0) return null;
  return (
    <EuiFlexGroup
      gutterSize="xs"
      alignItems="center"
      wrap
      responsive={false}
      style={{ marginTop: 4 }}
    >
      {state.filters.map((f, i) => (
        <EuiFlexItem grow={false} key={i}>
          <EuiBadge
            color={f.enabled === false ? 'default' : 'hollow'}
            iconType="cross"
            iconSide="right"
            iconOnClick={() => dispatch({ type: 'REMOVE_FILTER', index: i })}
            iconOnClickAriaLabel={`Remove ${f.name}${f.operator}${f.value}`}
            onClick={() => dispatch({ type: 'TOGGLE_FILTER', index: i })}
            onClickAriaLabel={`Toggle ${f.name}${f.operator}${f.value}`}
            style={f.enabled === false ? { opacity: 0.5, textDecoration: 'line-through' } : {}}
          >
            {f.name}
            {f.operator}&quot;{f.value}&quot;
          </EuiBadge>
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );
};
