/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiSwitch, EuiButtonGroup } from '@elastic/eui';
import React from 'react';
import { StateTimeLineChartStyleControls } from './state_timeline_config';
import { DebouncedFieldNumber, DebouncedFieldText } from '../style_panel/utils';
import { StyleAccordion } from '../style_panel/style_accordion';
import { DisableMode, DisconnectValuesOption } from '../types';

interface StateTimeLineExclusiveVisOptionsProps {
  styles: StateTimeLineChartStyleControls['exclusive'];
  useValueMappingColor?: boolean;
  onChange: (styles: StateTimeLineChartStyleControls['exclusive']) => void;
  onUseValueMappingColorChange: (useValueMappingColor: boolean) => void;
}

const disconnectValuesOption = [
  {
    id: DisableMode.Never,
    label: i18n.translate('explore.vis.stateTimeline.disconnectValuesOption.never', {
      defaultMessage: 'Never',
    }),
  },
  {
    id: DisableMode.Threshold,
    label: i18n.translate('explore.vis.stateTimeline.disconnectValuesOption.threshold', {
      defaultMessage: 'Threshold',
    }),
  },
];

export const StateTimeLineExclusiveVisOptions = ({
  styles,
  useValueMappingColor,
  onChange,
  onUseValueMappingColorChange,
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
          onChange={(e) => onUseValueMappingColorChange(e.target.checked)}
        />
      </EuiFormRow>
      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.vis.stateTimeline.exclusive.showValues', {
            defaultMessage: 'Show values',
          })}
          checked={styles?.showValues ?? false}
          onChange={(e) => updateStyle('showValues', e.target.checked)}
          data-test-subj="showValuesSwtich"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.vis.stateTimeline.exclusive.rowHeight', {
          defaultMessage: 'Row height',
        })}
      >
        <DebouncedFieldNumber
          value={styles.rowHeight}
          onChange={(value) => updateStyle('rowHeight', value)}
          placeholder="value between 0-1"
          max={1}
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.vis.stateTimeline.exclusive.disconnectValues.disableMode', {
          defaultMessage: 'Disconnect values',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate(
            'explore.stylePanel.texclusive.disconnectValues.disableMode.options',
            {
              defaultMessage: 'Disconnect values options',
            }
          )}
          options={disconnectValuesOption}
          idSelected={styles?.disconnectValues?.disableMode ?? DisableMode.Never}
          onChange={(id) =>
            updateStyle('disconnectValues', {
              ...styles?.disconnectValues,
              disableMode: id,
            } as DisconnectValuesOption)
          }
          buttonSize="compressed"
          isFullWidth
        />
      </EuiFormRow>

      {styles?.disconnectValues?.disableMode === DisableMode.Threshold && (
        <EuiFormRow
          label={i18n.translate(
            'explore.stylePanel.texclusive.disconnectValues.disableMode.threshold',
            {
              defaultMessage: 'Threshold',
            }
          )}
        >
          <DebouncedFieldText
            icon="arrowRight"
            value={styles?.disconnectValues?.threshold}
            onChange={(value) =>
              updateStyle('disconnectValues', {
                ...styles?.disconnectValues,
                threshold: value,
              } as DisconnectValuesOption)
            }
            placeholder="1h"
          />
        </EuiFormRow>
      )}
    </StyleAccordion>
  );
};
