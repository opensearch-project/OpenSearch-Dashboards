/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox, EuiComboBoxOptionOption, EuiSuperSelect } from '@elastic/eui';
import { Operation, OperationGrouping } from './promql_parser';
import { BuilderAction } from './build_promql';

const MODE_OPTIONS = [
  { value: 'by' as const, inputDisplay: 'by' },
  { value: 'without' as const, inputDisplay: 'without' },
];

export const useAggregationGrouping = (
  op: Operation,
  opIndex: number,
  labelOptions: EuiComboBoxOptionOption[],
  dispatch: React.Dispatch<BuilderAction>
) => {
  const mode = op.grouping?.mode || 'by';
  const labels = useMemo(() => op.grouping?.labels || [], [op.grouping?.labels]);

  const setGrouping = useCallback(
    (g?: OperationGrouping) =>
      dispatch({ type: 'SET_OPERATION_GROUPING', index: opIndex, grouping: g }),
    [dispatch, opIndex]
  );

  const setMode = useCallback(
    (newMode: 'by' | 'without') => setGrouping({ mode: newMode, labels }),
    [setGrouping, labels]
  );

  const selectedLabelOptions = useMemo(() => labels.map((l) => ({ label: l })), [labels]);

  const onLabelsChange = useCallback(
    (selected: EuiComboBoxOptionOption[]) => {
      const next = selected.map((s) => s.label);
      setGrouping(next.length ? { mode, labels: next } : undefined);
    },
    [setGrouping, mode]
  );

  const modeEl = (
    <EuiSuperSelect
      compressed
      options={MODE_OPTIONS}
      valueOfSelected={mode}
      onChange={(val) => setMode(val)}
      style={{ width: 100 }}
    />
  );

  const labelsComboEl = (
    <EuiComboBox
      compressed
      placeholder={i18n.translate('explore.promqlBuilder.selectLabels', {
        defaultMessage: 'Select labels',
      })}
      options={labelOptions}
      selectedOptions={selectedLabelOptions}
      onChange={onLabelsChange}
      onCreateOption={(val) => {
        const v = val.trim();
        if (v && !labels.includes(v)) {
          onLabelsChange([...selectedLabelOptions, { label: v }]);
        }
      }}
      style={{ minWidth: 400 }}
    />
  );

  return { modeEl, labelsComboEl };
};
