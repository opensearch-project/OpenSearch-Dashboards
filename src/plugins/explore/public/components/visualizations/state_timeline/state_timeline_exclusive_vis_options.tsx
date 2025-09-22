/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiButtonGroup, EuiSwitch } from '@elastic/eui';
import React from 'react';
import { StateTimeLineChartStyleControls } from './state_timeline_config';
import { DebouncedFieldNumber } from '../style_panel/utils';
import { StyleAccordion } from '../style_panel/style_accordion';

interface StateTimeLineExclusiveVisOptionsProps {
  styles: StateTimeLineChartStyleControls['exclusive'];
  useValueMappingColor?: boolean;
  onChange: (styles: StateTimeLineChartStyleControls['exclusive']) => void;
  handleUseValueMappingColorChange: (v: boolean) => void;
}

export const StateTimeLineExclusiveVisOptions = ({
  styles,
  useValueMappingColor,
  onChange,
  handleUseValueMappingColorChange,
}: StateTimeLineExclusiveVisOptionsProps) => {
  const updateStyle = <K extends keyof StateTimeLineChartStyleControls['exclusive']>(
    key: K,
    value: StateTimeLineChartStyleControls['exclusive'][K]
  ) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  return (
    <StyleAccordion
      id="pieSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.stateTimeline', {
        defaultMessage: 'State Timeline',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.stylePanel.valueMapping.useValueMappingColor', {
            defaultMessage: 'Use value mappings color',
          })}
          data-test-subj="useValueMappingColorButton"
          checked={useValueMappingColor ?? false}
          onChange={(e) => handleUseValueMappingColorChange(e.target.checked)}
        />
      </EuiFormRow>
      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.vis.stateTimeline.exclusive.showValues', {
            defaultMessage: 'Show values',
          })}
          checked={styles.showValues}
          onChange={(e) => updateStyle('showValues', e.target.checked)}
          data-test-subj="showValuesSwtich"
        />
      </EuiFormRow>

      {/* <EuiFormRow
        label={i18n.translate('explore.vis.stateTimeline.exclusive.valuesAlignment', {
          defaultMessage: 'Value alignment',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.vis.stateTimeline.exclusive.valuesAlignment', {
            defaultMessage: 'Value alignment',
          })}
          options={[
            {
              id: 'left',
              label: i18n.translate('explore.vis.stateTimeline.exclusive.valuesAlignment.left', {
                defaultMessage: 'Left',
              }),
            },
            {
              id: 'center',
              label: i18n.translate('explore.vis.stateTimeline.exclusive.valuesAlignment.center', {
                defaultMessage: 'Center',
              }),
            },
            {
              id: 'right',
              label: i18n.translate('explore.vis.stateTimeline.exclusive.valuesAlignment.right', {
                defaultMessage: 'Right',
              }),
            },
          ]}
          idSelected={styles.alignValues}
          onChange={(id) => updateStyle('alignValues', id as 'left' | 'center' | 'right')}
          buttonSize="compressed"
          isFullWidth={true}
          type="single"
          data-test-subj="valuesAlignmentButtonGroup"
        />
      </EuiFormRow> */}
    </StyleAccordion>
  );
};
