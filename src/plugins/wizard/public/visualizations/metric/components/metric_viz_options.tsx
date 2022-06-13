/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { FormattedMessage } from 'react-intl';
import produce from 'immer';
import { Draft } from 'immer';
import {
  ColorRanges,
  RangeOption,
  SetColorRangeValue,
  SwitchOption,
} from '../../../../../charts/public';
import { useTypedDispatch, useTypedSelector } from '../../../application/utils/state_management';
import { MetricOptionsDefaults } from '../metric_viz_type';
import { setState } from '../../../application/utils/state_management/style_slice';

function MetricVizOptions() {
  const styleState = useTypedSelector((state) => state.style) as MetricOptionsDefaults;
  const dispatch = useTypedDispatch();
  const { metric } = styleState;

  const setOption = useCallback(
    (callback: (draft: Draft<typeof styleState>) => void) => {
      const newState = produce(styleState, callback);
      dispatch(setState<MetricOptionsDefaults>(newState));
    },
    [dispatch, styleState]
  );

  return (
    <div>
      <EuiPanel paddingSize="s">
        <EuiTitle size="xs">
          <h3>
            <FormattedMessage id="visTypeMetric.params.settingsTitle" defaultMessage="Settings" />
          </h3>
        </EuiTitle>
        <EuiSpacer size="s" />

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
      </EuiPanel>

      <EuiSpacer size="s" />

      {/* TODO: Reintroduce the other style properties */}
      {/* <EuiPanel paddingSize="s">
        <EuiTitle size="xs">
          <h3>
            <FormattedMessage id="visTypeMetric.params.rangesTitle" defaultMessage="Ranges" />
          </h3>
        </EuiTitle>
        <EuiSpacer size="s" />

        <ColorRanges
          data-test-subj="metricColorRange"
          colorsRange={metric.colorsRange}
          setValue={setMetric('labels') as SetColorRangeValue}
          setTouched={setMetric('touched')}
          setValidity={setMetric('validity')}
        />

        <EuiFormRow fullWidth display="rowCompressed" label={metricColorModeLabel}>
          <EuiButtonGroup
            buttonSize="compressed"
            idSelected={metric.metricColorMode}
            isDisabled={metric.colorsRange.length === 1}
            isFullWidth={true}
            legend={metricColorModeLabel}
            options={vis.type.editorConfig.collections.metricColorMode}
            onChange={setColorMode}
          />
        </EuiFormRow>

        <ColorSchemaOptions
          colorSchema={metric.colorSchema}
          colorSchemas={vis.type.editorConfig.collections.colorSchemas}
          disabled={
            metric.colorsRange.length === 1 ||
            metric.metricColorMode === ColorModes.NONE
          }
          invertColors={metric.invertColors}
          setValue={setMetricValue as SetColorSchemaOptionsValue}
          showHelpText={false}
          uiState={uiState}
        />
      </EuiPanel>

      <EuiSpacer size="s" /> */}

      <EuiPanel paddingSize="s">
        <EuiTitle size="xs">
          <h3>
            <FormattedMessage id="visTypeMetric.params.style.styleTitle" defaultMessage="Style" />
          </h3>
        </EuiTitle>
        <EuiSpacer size="s" />

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
      </EuiPanel>
    </div>
  );
}

export { MetricVizOptions };
