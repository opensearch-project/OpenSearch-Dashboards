/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { EuiButtonGroup, EuiFormRow, EuiRange, EuiSpacer, EuiSwitch } from '@elastic/eui';
import { StyleAccordion } from '../style_panel/style_accordion';
import { DebouncedFieldText } from '../style_panel/utils';
import { useDebouncedNumber } from '../utils/use_debounced_value';
import {
  defaultAreaChartStyles,
  GradientMode,
  StackMode,
  DEFAULT_FILL_OPACITY,
  DEFAULT_GAP_THRESHOLD,
} from './area_vis_config';
import { ConnectNullValuesOption, DisconnectValuesOption, DisableMode } from '../types';

interface AreaExclusiveVisOptionsProps {
  addTimeMarker: boolean;
  areaOpacity: number | undefined;
  gradientMode: GradientMode;
  stackMode?: StackMode;
  connectNullValues?: ConnectNullValuesOption;
  disconnectValues?: DisconnectValuesOption;
  onAddTimeMarkerChange: (addTimeMarker: boolean) => void;
  onFillOpacityChange: (areaOpacity: number) => void;
  onGradientModeChange: (gradientMode: GradientMode) => void;
  onStackModeChange: (stackMode: StackMode) => void;
  onConnectNullValuesChange: (connectNullValues: ConnectNullValuesOption) => void;
  onDisconnectValuesChange: (disconnectValues: DisconnectValuesOption) => void;
  isTimeBased?: boolean;
}

export const AreaExclusiveVisOptions = ({
  addTimeMarker,
  areaOpacity,
  gradientMode,
  stackMode = 'none',
  connectNullValues,
  disconnectValues,
  onAddTimeMarkerChange,
  onFillOpacityChange,
  onGradientModeChange,
  onStackModeChange,
  onConnectNullValuesChange,
  onDisconnectValuesChange,
  isTimeBased = true,
}: AreaExclusiveVisOptionsProps) => {
  const [localFillOpacity, handleFillOpacityChange] = useDebouncedNumber(
    areaOpacity,
    (value) =>
      onFillOpacityChange(value ?? defaultAreaChartStyles?.areaOpacity ?? DEFAULT_FILL_OPACITY),
    { min: 0, max: 100 }
  );

  const stackModeOptions: Array<{ id: StackMode; label: string }> = [
    {
      id: 'none',
      label: i18n.translate('explore.stylePanel.area.stackModeNone', {
        defaultMessage: 'None',
      }),
    },
    {
      id: 'normal',
      label: i18n.translate('explore.stylePanel.area.stackModeNormal', {
        defaultMessage: 'Stack',
      }),
    },
    {
      id: 'percentage',
      label: i18n.translate('explore.stylePanel.area.stackModePercentage', {
        defaultMessage: 'Percentage',
      }),
    },
  ];

  const connectMode = connectNullValues?.connectMode ?? DisableMode.Never;
  const disconnectMode = disconnectValues?.disableMode ?? DisableMode.Never;

  const connectNullValuesOptions = [
    {
      id: DisableMode.Never,
      label: i18n.translate('explore.stylePanel.area.connectNullValues.never', {
        defaultMessage: 'Never',
      }),
    },
    {
      id: DisableMode.Always,
      label: i18n.translate('explore.stylePanel.area.connectNullValues.always', {
        defaultMessage: 'Always',
      }),
    },
    {
      id: DisableMode.Threshold,
      label: i18n.translate('explore.stylePanel.area.connectNullValues.threshold', {
        defaultMessage: 'Threshold',
      }),
    },
  ];

  const disconnectValuesOptions = [
    {
      id: DisableMode.Never,
      label: i18n.translate('explore.stylePanel.area.disconnectValues.never', {
        defaultMessage: 'Never',
      }),
    },
    {
      id: DisableMode.Threshold,
      label: i18n.translate('explore.stylePanel.area.disconnectValues.threshold', {
        defaultMessage: 'Threshold',
      }),
    },
  ];

  const gradientModeOptions: Array<{ id: GradientMode; label: string }> = [
    {
      id: 'none',
      label: i18n.translate('explore.stylePanel.area.gradientMode.none', {
        defaultMessage: 'None',
      }),
    },
    {
      id: 'opacity',
      label: i18n.translate('explore.stylePanel.area.gradientMode.opacity', {
        defaultMessage: 'Opacity',
      }),
    },
    {
      id: 'hue',
      label: i18n.translate('explore.stylePanel.area.gradientMode.hue', {
        defaultMessage: 'Hue',
      }),
    },
  ];

  return (
    <StyleAccordion
      id="areaSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.area', {
        defaultMessage: 'Area',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.area.stackMode', {
          defaultMessage: 'Stack',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.area.stackMode', {
            defaultMessage: 'Stack',
          })}
          options={stackModeOptions.map((option) => ({
            id: option.id,
            label: option.label,
            'data-test-subj': `areaStackMode-${option.id}`,
          }))}
          idSelected={stackMode}
          onChange={(id) => onStackModeChange(id as StackMode)}
          buttonSize="compressed"
          isFullWidth
          data-test-subj="areaStackModeButtonGroup"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.area.areaOpacity', {
          defaultMessage: 'Fill opacity',
        })}
      >
        <EuiRange
          compressed
          min={0}
          max={100}
          step={1}
          value={localFillOpacity ?? DEFAULT_FILL_OPACITY}
          onChange={(e) =>
            handleFillOpacityChange(
              e.currentTarget.value ? Number(e.currentTarget.value) : undefined
            )
          }
          aria-label={i18n.translate('explore.stylePanel.area.areaOpacity', {
            defaultMessage: 'Fill opacity',
          })}
          showLabels
          showValue
          data-test-subj="areaFillOpacityRange"
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('explore.stylePanel.area.gradientMode', {
          defaultMessage: 'Gradient mode',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('explore.stylePanel.area.gradientMode', {
            defaultMessage: 'Gradient mode',
          })}
          options={gradientModeOptions.map((option) => ({
            id: option.id,
            label: option.label,
            'data-test-subj': `areaGradientMode-${option.id}`,
          }))}
          idSelected={gradientMode}
          onChange={(id) => onGradientModeChange(id as GradientMode)}
          buttonSize="compressed"
          isFullWidth
        />
      </EuiFormRow>

      {isTimeBased && (
        <>
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.area.disconnectValues', {
              defaultMessage: 'Disconnect values',
            })}
          >
            <EuiButtonGroup
              legend={i18n.translate('explore.stylePanel.area.disconnectValues.options', {
                defaultMessage: 'Disconnect values options',
              })}
              isDisabled={connectMode !== DisableMode.Never}
              options={disconnectValuesOptions.map((option) => ({
                ...option,
                'data-test-subj': `areaDisconnectValues-${option.id}`,
              }))}
              idSelected={disconnectMode}
              onChange={(id) =>
                onDisconnectValuesChange({
                  threshold: disconnectValues?.threshold ?? DEFAULT_GAP_THRESHOLD,
                  disableMode: id as DisableMode,
                })
              }
              buttonSize="compressed"
              isFullWidth
              data-test-subj="areaDisconnectValuesButtonGroup"
            />
          </EuiFormRow>
          {disconnectMode === DisableMode.Threshold && (
            <EuiFormRow
              label={i18n.translate('explore.stylePanel.area.disconnectValues.thresholdLabel', {
                defaultMessage: 'Disconnect threshold',
              })}
              helpText={i18n.translate('explore.stylePanel.area.disconnectValues.thresholdHelp', {
                defaultMessage: 'Break the area when points sit further apart than this.',
              })}
            >
              <DebouncedFieldText
                value={disconnectValues?.threshold ?? DEFAULT_GAP_THRESHOLD}
                onChange={(threshold) =>
                  onDisconnectValuesChange({
                    disableMode: disconnectMode,
                    threshold,
                  })
                }
                placeholder={DEFAULT_GAP_THRESHOLD}
                data-test-subj="areaDisconnectValuesThreshold"
              />
            </EuiFormRow>
          )}
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.area.connectNullValues', {
              defaultMessage: 'Connect null values',
            })}
          >
            <EuiButtonGroup
              legend={i18n.translate('explore.stylePanel.area.connectNullValues.options', {
                defaultMessage: 'Connect null values options',
              })}
              isDisabled={disconnectMode !== DisableMode.Never}
              options={connectNullValuesOptions.map((option) => ({
                ...option,
                'data-test-subj': `areaConnectNullValues-${option.id}`,
              }))}
              idSelected={connectMode}
              onChange={(id) =>
                onConnectNullValuesChange({
                  threshold: connectNullValues?.threshold ?? DEFAULT_GAP_THRESHOLD,
                  connectMode: id as DisableMode,
                })
              }
              buttonSize="compressed"
              isFullWidth
              data-test-subj="areaConnectNullValuesButtonGroup"
            />
          </EuiFormRow>
          {connectMode === DisableMode.Threshold && (
            <EuiFormRow
              label={i18n.translate('explore.stylePanel.area.connectNullValues.thresholdLabel', {
                defaultMessage: 'Connect threshold',
              })}
              helpText={i18n.translate('explore.stylePanel.area.connectNullValues.thresholdHelp', {
                defaultMessage: 'Bridge gaps shorter than this, e.g. 5m or 1h.',
              })}
            >
              <DebouncedFieldText
                value={connectNullValues?.threshold ?? DEFAULT_GAP_THRESHOLD}
                onChange={(threshold) =>
                  onConnectNullValuesChange({
                    connectMode,
                    threshold,
                  })
                }
                placeholder={DEFAULT_GAP_THRESHOLD}
                data-test-subj="areaConnectNullValuesThreshold"
              />
            </EuiFormRow>
          )}
          <EuiSpacer size="s" />
          <EuiSwitch
            compressed
            label={i18n.translate('explore.stylePanel.area.showTimeMarker', {
              defaultMessage: 'Show current time marker',
            })}
            checked={addTimeMarker}
            onChange={(e) => onAddTimeMarkerChange(e.target.checked)}
            data-test-subj="areaAddTimeMarkerSwitch"
          />
        </>
      )}
      <EuiSpacer size="s" />
    </StyleAccordion>
  );
};
