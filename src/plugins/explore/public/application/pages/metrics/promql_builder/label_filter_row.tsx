/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFlexItem,
  EuiButtonIcon,
  EuiSuperSelect,
} from '@elastic/eui';
import { LabelFilter } from './promql_parser';
import { BuilderAction } from './build_promql';
import { OPERATORS } from './operation_categories';
import { comboBoxWidth } from './measure_text';

interface LabelFilterRowProps {
  filter: LabelFilter;
  idx: number;
  labelOptions: EuiComboBoxOptionOption[];
  labelValueOptions: EuiComboBoxOptionOption[];
  canRemove: boolean;
  dispatch: React.Dispatch<BuilderAction>;
  loadLabelValues: (labelName: string) => void;
}

export const LabelFilterRow: React.FC<LabelFilterRowProps> = ({
  filter,
  idx,
  labelOptions,
  labelValueOptions,
  canRemove,
  dispatch,
  loadLabelValues,
}) => (
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
          dispatch({ type: 'SET_LABEL_FILTER', index: idx, filter: { op: value } })
        }
        className="pqbOperatorSelect"
      />
      <div className="pqbSep" />
      <EuiComboBox
        compressed
        singleSelection={{ asPlainText: true }}
        isClearable={false}
        placeholder={i18n.translate('explore.promqlBuilder.labelValue', {
          defaultMessage: 'Label value',
        })}
        options={labelValueOptions}
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
          canRemove
            ? dispatch({ type: 'REMOVE_LABEL_FILTER', index: idx })
            : dispatch({
                type: 'SET_LABEL_FILTER',
                index: idx,
                filter: { label: '', op: '=', value: '' },
              })
        }
      />
    </div>
  </EuiFlexItem>
);
