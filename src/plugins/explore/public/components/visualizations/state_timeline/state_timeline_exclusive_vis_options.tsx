/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiSwitch, EuiButtonGroup } from '@elastic/eui';
import React from 'react';
import { StateTimeLineChartStyle } from './state_timeline_config';
import { DebouncedFieldNumber, DebouncedFieldText } from '../style_panel/utils';
import { StyleAccordion } from '../style_panel/style_accordion';
import { DisableMode, DisconnectValuesOption, ConnectNullValuesOption } from '../types';

interface StateTimeLineExclusiveVisOptionsProps {
  styles: StateTimeLineChartStyle['exclusive'];
  onChange: (styles: StateTimeLineChartStyle['exclusive']) => void;
  useThresholdColor?: boolean;
  onUseThresholdColorChange: (useThresholdColor: boolean) => void;
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

const connectValuesOption = [
  {
    id: DisableMode.Never,
    label: i18n.translate('explore.vis.stateTimeline.connectValuesOption.never', {
      defaultMessage: 'Never',
    }),
  },
  {
    id: DisableMode.Threshold,
    label: i18n.translate('explore.vis.stateTimeline.connectValuesOption.threshold', {
      defaultMessage: 'Threshold',
    }),
  },
];

export const StateTimeLineExclusiveVisOptions = ({
  styles,
  onChange,
  useThresholdColor,
  onUseThresholdColorChange,
}: StateTimeLineExclusiveVisOptionsProps) => {
  const updateStyle = <K extends keyof StateTimeLineChartStyle['exclusive']>(
    key: K,
    value: StateTimeLineChartStyle['exclusive'][K]
  ) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  return (
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    <StyleAccordion
      id="stateTimelineSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.stateTimeline', {
        defaultMessage: 'State Timeline',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.vis.statetimeline.useThresholdColor', {
            defaultMessage: 'Use threshold color',
          })}
          data-test-subj="useThresholdColorButton"
          checked={useThresholdColor ?? false}
          onChange={(e) => onUseThresholdColorChange(e.target.checked)}
        />
      </EuiFormRow>

      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.vis.stateTimeline.exclusive.showValues', {
            defaultMessage: 'Show display text',
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
          isDisabled={styles?.connectNullValues?.connectMode !== DisableMode.Never}
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
          data-test-subj="disconnectValuesGroupButton"
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
            data-test-subj="disableValuesThreshold"
          />
        </EuiFormRow>
      )}

      <EuiFormRow
        label={i18n.translate('explore.vis.stateTimeline.exclusive.connectValues.connectMode', {
          defaultMessage: 'Connect null values',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate(
            'explore.stylePanel.stateTimeline.exclusive.connectValues.options',
            {
              defaultMessage: 'Connect null values options',
            }
          )}
          isDisabled={styles?.disconnectValues?.disableMode !== DisableMode.Never}
          options={connectValuesOption}
          idSelected={styles?.connectNullValues?.connectMode ?? DisableMode.Never}
          onChange={(id) =>
            updateStyle('connectNullValues', {
              ...styles?.connectNullValues,
              connectMode: id,
            } as ConnectNullValuesOption)
          }
          buttonSize="compressed"
          isFullWidth
          data-test-subj="connectValuesGroupButton"
        />
      </EuiFormRow>

      {styles?.connectNullValues?.connectMode === DisableMode.Threshold && (
        <EuiFormRow
          label={i18n.translate(
            'explore.stylePanel.texclusive.connectValues.connectMode.threshold',
            {
              defaultMessage: 'Threshold',
            }
          )}
        >
          <DebouncedFieldText
            icon="arrowLeft"
            value={styles?.connectNullValues?.threshold}
            onChange={(value) =>
              updateStyle('connectNullValues', {
                ...styles?.connectNullValues,
                threshold: value,
              } as ConnectNullValuesOption)
            }
            placeholder="1h"
            data-test-subj="connectValuesThreshold"
          />
        </EuiFormRow>
      )}
    </StyleAccordion>
  );
};
