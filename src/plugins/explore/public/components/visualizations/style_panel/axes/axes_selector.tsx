/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiSpacer,
  EuiFormRow,
  EuiFlexItem,
  EuiComboBox,
  EuiComboBoxOptionOption,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AxisRole, VisColumn } from '../../types';

interface VisColumnOption {
  column: VisColumn;
  label: string;
}

const AXIS_SELECT_LABEL = {
  [AxisRole.X]: i18n.translate('explore.visualize.axisSelectLabelX', {
    defaultMessage: 'X-Axis',
  }),
  [AxisRole.Y]: i18n.translate('explore.visualize.axisSelectLabelY', {
    defaultMessage: 'Y-Axis',
  }),
  [AxisRole.COLOR]: i18n.translate('explore.visualize.axisSelectLabelColor', {
    defaultMessage: 'Color',
  }),
  [AxisRole.FACET]: i18n.translate('explore.visualize.axisSelectLabelFacet', {
    defaultMessage: 'Split chart by',
  }),
  [AxisRole.SIZE]: i18n.translate('explore.visualize.axisSelectLabelSize', {
    defaultMessage: 'Size',
  }),
  [AxisRole.Y_SECOND]: i18n.translate('explore.visualize.axisSelectLabelY2nd', {
    defaultMessage: 'Y-Axis (2nd)',
  }),
  [AxisRole.Value]: i18n.translate('explore.visualize.axisSelectLabelValue', {
    defaultMessage: 'Value',
  }),
  [AxisRole.Time]: i18n.translate('explore.visualize.axisSelectLabelTime', {
    defaultMessage: 'Time',
  }),
};

interface AxesSelectorOptions {
  axisRole: AxisRole;
  selectedColumn: string;
  allColumnOptions: Array<EuiComboBoxOptionOption<VisColumnOption>>;
  onRemove: (axisRole: AxisRole) => void;
  onChange: (axisRole: AxisRole, value: string) => void;
  switchAxes?: boolean;
  autoFocus?: boolean;
  inputRef?: (instance: HTMLInputElement) => void;
}

export const AxisSelector: React.FC<AxesSelectorOptions> = ({
  axisRole,
  selectedColumn,
  allColumnOptions,
  onRemove,
  onChange,
  switchAxes,
  inputRef,
}) => {
  const getLabel = () => {
    if (switchAxes && (axisRole === AxisRole.X || axisRole === AxisRole.Y)) {
      const swappedRole = axisRole === AxisRole.X ? AxisRole.Y : AxisRole.X;
      return AXIS_SELECT_LABEL[swappedRole];
    }

    return AXIS_SELECT_LABEL[axisRole];
  };

  return (
    <React.Fragment key={`${axisRole}Selector`}>
      <EuiFormRow label={getLabel()}>
        <EuiFlexItem>
          <EuiComboBox
            data-test-subj={`field-${axisRole}`}
            compressed
            inputRef={inputRef}
            selectedOptions={[{ label: selectedColumn }]}
            singleSelection={{ asPlainText: true }}
            options={allColumnOptions}
            onChange={(value) => {
              if (Boolean(value.length)) {
                onChange(axisRole, value[0].label);
              } else {
                onRemove(axisRole);
              }
            }}
          />
        </EuiFlexItem>
      </EuiFormRow>
      <EuiSpacer size="xs" />
    </React.Fragment>
  );
};
