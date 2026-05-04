/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox, EuiComboBoxOptionOption, EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { Operation, RANGE_FUNCTIONS } from './promql_parser';
import { BuilderAction } from './build_promql';
import { OperationDef, GROUPABLE_AGGREGATION_IDS } from './operation_categories';
import { OP_DEF_MAP, getCategoryLabel } from './operation_lookup';
import { useAggregationGrouping } from './aggregation_grouping';
import { comboBoxWidth, inputWidth } from './measure_text';

interface OperationPillProps {
  op: Operation;
  idx: number;
  dispatch: React.Dispatch<BuilderAction>;
  labelOptions: EuiComboBoxOptionOption[];
  getOperationSiblings: (opId: string) => OperationDef[];
  hasRange?: boolean;
}

export const OperationPill: React.FC<OperationPillProps> = ({
  op,
  idx,
  dispatch,
  labelOptions,
  getOperationSiblings,
  hasRange,
}) => {
  const isAgg = GROUPABLE_AGGREGATION_IDS.has(op.id);
  const grouping = useAggregationGrouping(op, idx, labelOptions, dispatch);
  const opDef = OP_DEF_MAP[op.id];
  const isRangeFn = RANGE_FUNCTIONS.has(op.id);
  // Aggregations render as keyword tokens in the editor and preview —
  // mirror that color on the operation-name combobox.
  const opComboClass = GROUPABLE_AGGREGATION_IDS.has(op.id) ? 'pqbCombo--aggName' : undefined;
  // When hasRange is set, the range param (first param for most range fns,
  // second for quantile_over_time) is on the metric row — skip it in the pill.
  const rangeParamIdx = isRangeFn && hasRange ? (op.id === 'quantile_over_time' ? 1 : 0) : -1;

  return (
    <div className="pqbGroup">
      <span className="pqbGroup__label">{getCategoryLabel(op.id)}</span>
      <div className="pqbPill__body">
        <EuiComboBox
          compressed
          singleSelection={{ asPlainText: true }}
          options={getOperationSiblings(op.id).map((s) => ({ label: s.name }))}
          selectedOptions={[{ label: op.name }]}
          onChange={(selected) => {
            const newName = selected[0]?.label || op.name;
            const newDef = getOperationSiblings(op.id).find((s) => s.name === newName);
            if (newDef) {
              dispatch({
                type: 'REPLACE_OPERATION',
                index: idx,
                operation: { id: newDef.id, name: newDef.name, params: [...newDef.params] },
              });
            }
          }}
          className={opComboClass}
          style={{ minWidth: comboBoxWidth(op.name) }}
        />
        {isAgg && <div className="pqbSep" />}
        {isAgg && grouping.modeEl}
        {isAgg && <div className="pqbSep" />}
        {isAgg && grouping.labelsComboEl}
        {op.params.length > 0 &&
          op.params.map((p, pi) => {
            if (pi === rangeParamIdx) return null;
            const placeholder = opDef?.paramNames?.[pi] || '';
            const displayText = p || placeholder;
            return (
              <React.Fragment key={pi}>
                <div className="pqbSep" />
                <input
                  value={p}
                  placeholder={placeholder}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_OPERATION_PARAM',
                      index: idx,
                      paramIndex: pi,
                      value: e.target.value,
                    })
                  }
                  className="pqbParamInput"
                  style={{ width: inputWidth(displayText) }}
                />
              </React.Fragment>
            );
          })}
        <div className="pqbSep" />
        <EuiButtonIcon
          iconType="cross"
          size="s"
          color="text"
          aria-label={i18n.translate('explore.promqlBuilder.removeOperation', {
            defaultMessage: 'Remove operation',
          })}
          onClick={() => dispatch({ type: 'REMOVE_OPERATION', index: idx })}
        />
        <EuiToolTip content={opDef?.description || ''}>
          <EuiButtonIcon
            iconType="iInCircle"
            size="s"
            color="text"
            aria-label={i18n.translate('explore.promqlBuilder.operationInfo', {
              defaultMessage: 'Operation info',
            })}
          />
        </EuiToolTip>
      </div>
    </div>
  );
};
