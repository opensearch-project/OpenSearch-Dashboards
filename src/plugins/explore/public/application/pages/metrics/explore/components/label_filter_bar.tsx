/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { i18n } from '@osd/i18n';
import { LabelFilter } from '../types';
import { PrometheusClient } from '../services/prometheus_client';
import { useExploration } from '../contexts/exploration_context';

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
        <small>
          {i18n.translate('explore.metricsExplore.operatorEquals', { defaultMessage: 'Equals' })}
        </small>
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
        <small>
          {i18n.translate('explore.metricsExplore.operatorNotEqual', {
            defaultMessage: 'Not equal',
          })}
        </small>
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
        <small>
          {i18n.translate('explore.metricsExplore.operatorMatchesRegex', {
            defaultMessage: 'Matches regex',
          })}
        </small>
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
        <small>
          {i18n.translate('explore.metricsExplore.operatorNotMatchRegex', {
            defaultMessage: 'Does not match regex',
          })}
        </small>
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
          aria-label={i18n.translate('explore.metricsExplore.addLabelFilterAriaLabel', {
            defaultMessage: 'Add label filter',
          })}
          data-test-subj="addLabelFilter"
        >
          {i18n.translate('explore.metricsExplore.labelFilter', { defaultMessage: 'Label' })}
          <EuiIcon type="filter" style={{ marginLeft: 4 }} />
        </EuiSmallButtonEmpty>
      }
      anchorPosition="downLeft"
      panelPaddingSize="s"
    >
      <EuiFlexGroup gutterSize="s" direction="column" style={{ width: 260 }}>
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('explore.metricsExplore.labelName', {
              defaultMessage: 'Label',
            })}
            compressed
          >
            <EuiComboBox
              placeholder={i18n.translate('explore.metricsExplore.selectLabel', {
                defaultMessage: 'Select label...',
              })}
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
            <EuiFormRow
              label={i18n.translate('explore.metricsExplore.operator', {
                defaultMessage: 'Operator',
              })}
              compressed
            >
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
            <EuiFormRow
              label={i18n.translate('explore.metricsExplore.value', {
                defaultMessage: 'Value',
              })}
              compressed
            >
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
  client: PrometheusClient;
  onAdd: (filter: LabelFilter) => void;
}

export const LabelFilterBar: React.FC<LabelFilterBarProps> = ({ metric, client, onAdd }) => {
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
      .catch((e) => {
        if (e?.name !== 'AbortError') {
          // eslint-disable-next-line no-console
          console.debug('Failed to fetch labels', e);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, metric]);

  const valueOptionsRef = useRef(valueOptions);
  valueOptionsRef.current = valueOptions;

  const loadValues = useCallback(
    (name: string) => {
      setActiveName(name);
      if (!name || valueOptionsRef.current[name]) return;
      client
        .getLabelValues(name, metric)
        .then((vals) => {
          setValueOptions((prev) => ({ ...prev, [name]: vals.map((v) => ({ label: v })) }));
        })
        .catch((e) => {
          if (e?.name !== 'AbortError') {
            // eslint-disable-next-line no-console
            console.debug('Failed to fetch label values', e);
          }
        });
    },
    [client, metric]
  );

  return (
    <LabelFilterPopover
      labelNames={labelNames}
      loadValues={loadValues}
      valueOptions={valueOptions[activeName] || []}
      onAdd={onAdd}
    />
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
