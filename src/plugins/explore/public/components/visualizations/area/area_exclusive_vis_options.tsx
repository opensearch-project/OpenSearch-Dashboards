/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { EuiButtonGroup, EuiFormRow, EuiRange, EuiSpacer, EuiSwitch } from '@elastic/eui';
import { StyleAccordion } from '../style_panel/style_accordion';
import { useDebouncedNumber } from '../utils/use_debounced_value';
import { defaultAreaChartStyles, GradientMode, DEFAULT_FILL_OPACITY } from './area_vis_config';

interface AreaExclusiveVisOptionsProps {
  addTimeMarker: boolean;
  areaOpacity: number | undefined;
  gradientMode: GradientMode;
  onAddTimeMarkerChange: (addTimeMarker: boolean) => void;
  onFillOpacityChange: (areaOpacity: number) => void;
  onGradientModeChange: (gradientMode: GradientMode) => void;
  shouldShowTimeMarker?: boolean;
}

export const AreaExclusiveVisOptions = ({
  addTimeMarker,
  areaOpacity,
  gradientMode,
  onAddTimeMarkerChange,
  onFillOpacityChange,
  onGradientModeChange,
  shouldShowTimeMarker = true,
}: AreaExclusiveVisOptionsProps) => {
  const [localFillOpacity, handleFillOpacityChange] = useDebouncedNumber(
    areaOpacity,
    (value) =>
      onFillOpacityChange(value ?? defaultAreaChartStyles?.areaOpacity ?? DEFAULT_FILL_OPACITY),
    { min: 0, max: 100 }
  );

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

      {shouldShowTimeMarker && (
        <>
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
