/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonGroup, EuiFormRow } from '@elastic/eui';
import produce from 'immer';
import { Draft } from 'immer';
import {
  ColorModes,
  ColorRanges,
  ColorSchemaOptions,
  colorSchemas,
  RangeOption,
  SwitchOption,
} from '../../../../../charts/public';
import {
  useTypedDispatch,
  useTypedSelector,
  setStyleState,
} from '../../../application/utils/state_management';
import { MetricOptionsDefaults } from '../metric_viz_type';
import { PersistedState } from '../../../../../visualizations/public';
import { Option } from '../../../application/app';

const METRIC_COLOR_MODES = [
  {
    id: ColorModes.NONE,
    label: i18n.translate('visTypeMetric.colorModes.noneOptionLabel', {
      defaultMessage: 'None',
    }),
  },
  {
    id: ColorModes.LABELS,
    label: i18n.translate('visTypeMetric.colorModes.labelsOptionLabel', {
      defaultMessage: 'Labels',
    }),
  },
  {
    id: ColorModes.BACKGROUND,
    label: i18n.translate('visTypeMetric.colorModes.backgroundOptionLabel', {
      defaultMessage: 'Background',
    }),
  },
];

function MetricVizOptions() {
  const styleState = useTypedSelector((state) => state.style) as MetricOptionsDefaults;
  const dispatch = useTypedDispatch();
  const { metric } = styleState;

  const setOption = useCallback(
    (callback: (draft: Draft<typeof styleState>) => void) => {
      const newState = produce(styleState, callback);
      dispatch(setStyleState<MetricOptionsDefaults>(newState));
    },
    [dispatch, styleState]
  );

  const metricColorModeLabel = i18n.translate('visTypeMetric.params.color.useForLabel', {
    defaultMessage: 'Use color for',
  });

  return (
    <>
      <Option
        title={i18n.translate('visTypeMetric.params.settingsTitle', { defaultMessage: 'Settings' })}
        initialIsOpen
      >
        <SwitchOption
          label={i18n.translate('visTypeMetric.params.percentageModeLabel', {
            defaultMessage: 'Percentage mode',
          })}
          paramName="percentageMode"
          value={metric.percentageMode}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.metric.percentageMode = value;
            })
          }
        />

        <SwitchOption
          label={i18n.translate('visTypeMetric.params.showTitleLabel', {
            defaultMessage: 'Show title',
          })}
          paramName="show"
          value={metric.labels.show}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.metric.labels.show = value;
            })
          }
        />
      </Option>
      <Option
        title={i18n.translate('visTypeMetric.params.rangesTitle', { defaultMessage: 'Ranges' })}
      >
        <ColorRanges
          data-test-subj="metricColorRange"
          colorsRange={metric.colorsRange}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.metric.colorsRange = value;
            })
          }
          setTouched={() => {}}
          setValidity={() => {}}
        />

        <EuiFormRow fullWidth display="rowCompressed" label={metricColorModeLabel}>
          <EuiButtonGroup
            buttonSize="compressed"
            idSelected={metric.metricColorMode}
            isDisabled={metric.colorsRange.length === 1}
            isFullWidth={true}
            legend={metricColorModeLabel}
            options={METRIC_COLOR_MODES}
            onChange={(value) =>
              setOption((draft) => {
                draft.metric.metricColorMode = value as ColorModes;
              })
            }
          />
        </EuiFormRow>

        <ColorSchemaOptions
          colorSchema={metric.colorSchema}
          colorSchemas={colorSchemas}
          disabled={metric.colorsRange.length === 1 || metric.metricColorMode === ColorModes.NONE}
          invertColors={metric.invertColors}
          setValue={(paramName, value) =>
            setOption((draft) => {
              // The paramName and associated value are expected to pair correctly but will be messy to type correctly
              draft.metric[paramName] = value as any;
            })
          }
          showHelpText={false}
          // uistate here is used for custom colors which is not currently supported. Update when supported
          uiState={new PersistedState({})}
        />
      </Option>
      <Option
        title={i18n.translate('visTypeMetric.params.style.styleTitle', { defaultMessage: 'Style' })}
      >
        <RangeOption
          label={i18n.translate('visTypeMetric.params.style.fontSizeLabel', {
            defaultMessage: 'Metric font size in points',
          })}
          min={12}
          max={120}
          paramName="fontSize"
          value={metric.style.fontSize}
          setValue={(_, value) =>
            setOption((draft) => {
              draft.metric.style.fontSize = value;
            })
          }
          showInput={true}
          showLabels={true}
          showValue={false}
        />
      </Option>
    </>
  );
}

export { MetricVizOptions };
