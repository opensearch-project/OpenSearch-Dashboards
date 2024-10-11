/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { DataFormatPicker } from '../../data_format_picker';
import { createSelectHandler } from '../../lib/create_select_handler';
import { YesNo } from '../../yes_no';
import { createTextHandler } from '../../lib/create_text_handler';
import { IndexPattern } from '../../index_pattern';
import {
  htmlIdGenerator,
  EuiCompressedComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFieldText,
  EuiCompressedFormRow,
  EuiCode,
  EuiHorizontalRule,
  EuiCompressedFieldNumber,
  EuiFormLabel,
  EuiSpacer,
  EuiFormControlLayout,
} from '@elastic/eui';
import { FormattedMessage, injectI18n } from '@osd/i18n/react';
import { getDefaultQueryLanguage } from '../../lib/get_default_query_language';
import { QueryBarWrapper } from '../../query_bar_wrapper';

import { isPercentDisabled } from '../../lib/stacked';
import { STACKED_OPTIONS, AXIS_POSITION } from '../../../visualizations/constants/chart';

export const TimeseriesConfig = injectI18n(function (props) {
  const handleSelectChange = createSelectHandler(props.onChange);
  const handleTextChange = createTextHandler(props.onChange);
  const defaults = {
    fill: '',
    line_width: '',
    point_size: '',
    value_template: '{{value}}',
    offset_time: '',
    split_color_mode: 'opensearchDashboards',
    axis_min: '',
    axis_max: '',
    stacked: STACKED_OPTIONS.NONE,
    steps: 0,
  };
  const model = { ...defaults, ...props.model };
  const htmlId = htmlIdGenerator();
  const { intl } = props;
  const stackedOptions = [
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.noneLabel',
        defaultMessage: 'None',
      }),
      value: STACKED_OPTIONS.NONE,
    },
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.stackedLabel',
        defaultMessage: 'Stacked',
      }),
      value: STACKED_OPTIONS.STACKED,
    },
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.stackedWithinSeriesLabel',
        defaultMessage: 'Stacked within series',
      }),
      value: STACKED_OPTIONS.STACKED_WITHIN_SERIES,
    },
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.percentLabel',
        defaultMessage: 'Percent',
      }),
      value: STACKED_OPTIONS.PERCENT,
      disabled: isPercentDisabled(props.seriesQuantity[model.id]),
    },
  ];
  const selectedStackedOption = stackedOptions.find((option) => {
    return model.stacked === option.value;
  });

  const positionOptions = [
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.rightLabel',
        defaultMessage: 'Right',
      }),
      value: AXIS_POSITION.RIGHT,
    },
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.leftLabel',
        defaultMessage: 'Left',
      }),
      value: AXIS_POSITION.LEFT,
    },
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.hiddenLabel',
        defaultMessage: 'Hidden',
      }),
      value: AXIS_POSITION.HIDDEN,
    },
  ];

  const selectedAxisPosOption = positionOptions.find((option) => {
    return model.axis_position === option.value;
  });

  const scaleOptions = [
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeseries.scaleOptions.normalLabel',
        defaultMessage: 'Normal',
      }),
      value: 'normal',
    },
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeseries.scaleOptions.logLabel',
        defaultMessage: 'Log',
      }),
      value: 'log',
    },
  ];
  const selectedAxisScaleOption = scaleOptions.find((option) => {
    return model.axis_scale === option.value;
  });

  const chartTypeOptions = [
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.barLabel',
        defaultMessage: 'Bar',
      }),
      value: 'bar',
    },
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.lineLabel',
        defaultMessage: 'Line',
      }),
      value: 'line',
    },
  ];
  const selectedChartTypeOption = chartTypeOptions.find((option) => {
    return model.chart_type === option.value;
  });

  const splitColorOptions = [
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.defaultPaletteLabel',
        defaultMessage: 'Default palette',
      }),
      value: 'opensearchDashboards',
    },
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.rainbowLabel',
        defaultMessage: 'Rainbow',
      }),
      value: 'rainbow',
    },
    {
      label: intl.formatMessage({
        id: 'visTypeTimeseries.timeSeries.gradientLabel',
        defaultMessage: 'Gradient',
      }),
      value: 'gradient',
    },
  ];
  const selectedSplitColorOption = splitColorOptions.find((option) => {
    return model.split_color_mode === option.value;
  });

  let type;

  if (model.chart_type === 'line') {
    type = (
      <EuiFlexGroup gutterSize="s" responsive={false} wrap={true}>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('chartType')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.chartLine.chartTypeLabel"
                defaultMessage="Chart type"
              />
            }
          >
            <EuiCompressedComboBox
              isClearable={false}
              options={chartTypeOptions}
              selectedOptions={selectedChartTypeOption ? [selectedChartTypeOption] : []}
              onChange={handleSelectChange('chart_type')}
              singleSelection={{ asPlainText: true }}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('stacked')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.chartLine.stackedLabel"
                defaultMessage="Stacked"
              />
            }
          >
            <EuiCompressedComboBox
              isClearable={false}
              options={stackedOptions}
              selectedOptions={selectedStackedOption ? [selectedStackedOption] : []}
              onChange={handleSelectChange('stacked')}
              singleSelection={{ asPlainText: true }}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('fill')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.chartLine.fillLabel"
                defaultMessage="Fill (0 to 1)"
              />
            }
          >
            <EuiCompressedFieldNumber
              step={0.1}
              onChange={handleTextChange('fill')}
              value={Number(model.fill)}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('lineWidth')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.chartLine.lineWidthLabel"
                defaultMessage="Line width"
              />
            }
          >
            <EuiCompressedFieldNumber
              onChange={handleTextChange('line_width')}
              value={Number(model.line_width)}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('pointSize')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.chartLine.pointSizeLabel"
                defaultMessage="Point size"
              />
            }
          >
            <EuiCompressedFieldNumber
              onChange={handleTextChange('point_size')}
              value={Number(model.point_size)}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFormLabel>
            <FormattedMessage
              id="visTypeTimeseries.timeSeries.chartLine.stepsLabel"
              defaultMessage="Steps"
            />
          </EuiFormLabel>
          <EuiSpacer size="s" />
          <YesNo value={model.steps} name="steps" onChange={props.onChange} />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
  if (model.chart_type === 'bar') {
    type = (
      <EuiFlexGroup gutterSize="s" responsive={false} wrap={true}>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('chartType')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.chartBar.chartTypeLabel"
                defaultMessage="Chart type"
              />
            }
          >
            <EuiCompressedComboBox
              isClearable={false}
              options={chartTypeOptions}
              selectedOptions={selectedChartTypeOption ? [selectedChartTypeOption] : []}
              onChange={handleSelectChange('chart_type')}
              singleSelection={{ asPlainText: true }}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('stacked')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.chartBar.stackedLabel"
                defaultMessage="Stacked"
              />
            }
          >
            <EuiCompressedComboBox
              isClearable={false}
              options={stackedOptions}
              selectedOptions={selectedStackedOption ? [selectedStackedOption] : []}
              onChange={handleSelectChange('stacked')}
              singleSelection={{ asPlainText: true }}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('fill')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.chartBar.fillLabel"
                defaultMessage="Fill (0 to 1)"
              />
            }
          >
            <EuiCompressedFieldNumber
              step={0.1}
              onChange={handleTextChange('fill')}
              value={Number(model.fill)}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('lineWidth')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.chartBar.lineWidthLabel"
                defaultMessage="Line width"
              />
            }
          >
            <EuiCompressedFieldNumber
              onChange={handleTextChange('line_width')}
              value={Number(model.line_width)}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  const disableSeparateYaxis = model.separate_axis ? false : true;

  const seriesIndexPattern =
    props.model.override_index_pattern && props.model.series_index_pattern
      ? props.model.series_index_pattern
      : props.indexPatternForQuery;

  return (
    <div className="tvbAggRow">
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={false}>
          <DataFormatPicker onChange={handleSelectChange('formatter')} value={model.formatter} />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCompressedFormRow
            id={htmlId('template')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.templateLabel"
                defaultMessage="Template"
              />
            }
            helpText={
              <span>
                <FormattedMessage
                  id="visTypeTimeseries.timeSeries.templateHelpText"
                  defaultMessage="eg.{templateExample}"
                  values={{ templateExample: <EuiCode>{'{{value}}/s'}</EuiCode> }}
                />
              </span>
            }
            fullWidth
          >
            <EuiCompressedFieldText
              onChange={handleTextChange('value_template')}
              value={model.value_template}
              fullWidth
              data-test-subj="tsvb_series_value"
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiHorizontalRule margin="s" />
      <EuiFlexItem>
        <EuiCompressedFormRow
          id={htmlId('series_filter')}
          label={
            <FormattedMessage
              id="visTypeTimeseries.timeSeries.filterLabel"
              defaultMessage="Filter"
            />
          }
          fullWidth
        >
          <QueryBarWrapper
            query={{
              language:
                model.filter && model.filter.language
                  ? model.filter.language
                  : getDefaultQueryLanguage(),
              query: model.filter && model.filter.query ? model.filter.query : '',
            }}
            onChange={(filter) => props.onChange({ filter })}
            indexPatterns={[seriesIndexPattern]}
          />
        </EuiCompressedFormRow>
      </EuiFlexItem>
      <EuiHorizontalRule margin="s" />

      {type}

      <EuiHorizontalRule margin="s" />

      <EuiFlexGroup responsive={false} wrap={true}>
        <EuiFlexItem grow={true}>
          <EuiCompressedFormRow
            id={htmlId('offset')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.offsetSeriesTimeLabel"
                defaultMessage="Offset series time by (1m, 1h, 1w, 1d)"
                description="1m, 1h, 1w, 1d are required values and must not be translated."
              />
            }
          >
            <EuiCompressedFieldText
              data-test-subj="offsetTimeSeries"
              onChange={handleTextChange('offset_time')}
              value={model.offset_time}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
          <EuiFormLabel>
            <FormattedMessage
              id="visTypeTimeseries.timeSeries.hideInLegendLabel"
              defaultMessage="Hide in legend"
            />
          </EuiFormLabel>
          <EuiSpacer size="s" />
          <YesNo value={model.hide_in_legend} name="hide_in_legend" onChange={props.onChange} />
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
          <EuiCompressedFormRow
            id={htmlId('splitColor')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.splitColorThemeLabel"
                defaultMessage="Split color theme"
              />
            }
          >
            <EuiCompressedComboBox
              isClearable={false}
              options={splitColorOptions}
              selectedOptions={selectedSplitColorOption ? [selectedSplitColorOption] : []}
              onChange={handleSelectChange('split_color_mode')}
              singleSelection={{ asPlainText: true }}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiHorizontalRule margin="s" />

      <EuiFlexGroup responsive={false} wrap={true}>
        <EuiFlexItem grow={false}>
          <EuiFormLabel>
            <FormattedMessage
              id="visTypeTimeseries.timeSeries.separateAxisLabel"
              defaultMessage="Separate axis?"
            />
          </EuiFormLabel>
          <EuiSpacer size="s" />
          <YesNo value={model.separate_axis} name="separate_axis" onChange={props.onChange} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('axisMin')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.axisMinLabel"
                defaultMessage="Axis min"
              />
            }
          >
            <EuiFormControlLayout compressed={true}>
              {/*
                EUITODO: The following input couldn't be converted to EUI because of type mis-match.
                It accepts a null value, but is passed a empty string.
              */}
              <input
                className="euiFieldText euiFieldText--compressed"
                type="number"
                disabled={disableSeparateYaxis}
                onChange={handleTextChange('axis_min')}
                value={model.axis_min}
              />
            </EuiFormControlLayout>
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('axisMax')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.axisMaxLabel"
                defaultMessage="Axis max"
              />
            }
          >
            <EuiFormControlLayout compressed={true}>
              {/*
                EUITODO: The following input couldn't be converted to EUI because of type mis-match.
                It accepts a null value, but is passed a empty string.
              */}
              <input
                className="euiFieldText euiFieldText--compressed"
                type="number"
                disabled={disableSeparateYaxis}
                onChange={handleTextChange('axis_max')}
                value={model.axis_max}
              />
            </EuiFormControlLayout>
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('axisPos')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeSeries.axisPositionLabel"
                defaultMessage="Axis position"
              />
            }
          >
            <EuiCompressedComboBox
              isClearable={false}
              isDisabled={disableSeparateYaxis}
              options={positionOptions}
              selectedOptions={selectedAxisPosOption ? [selectedAxisPosOption] : []}
              onChange={handleSelectChange('axis_position')}
              singleSelection={{ asPlainText: true }}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('axisScale')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.timeseries.optionsTab.axisScaleLabel"
                defaultMessage="Axis scale"
              />
            }
          >
            <EuiCompressedComboBox
              isClearable={false}
              isDisabled={disableSeparateYaxis}
              options={scaleOptions}
              selectedOptions={selectedAxisScaleOption ? [selectedAxisScaleOption] : []}
              onChange={handleSelectChange('axis_scale')}
              singleSelection={{ asPlainText: true }}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiHorizontalRule margin="s" />

      <EuiFlexGroup gutterSize="s" responsive={false} wrap={true}>
        <EuiFlexItem grow={false}>
          <EuiFormLabel>
            <FormattedMessage
              id="visTypeTimeseries.timeSeries.overrideIndexPatternLabel"
              defaultMessage="Override Index Pattern?"
            />
          </EuiFormLabel>
          <EuiSpacer size="s" />
          <YesNo
            value={model.override_index_pattern}
            name="override_index_pattern"
            onChange={props.onChange}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <IndexPattern
            {...props}
            prefix="series_"
            disabled={!model.override_index_pattern}
            with-interval={true}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
});

TimeseriesConfig.propTypes = {
  fields: PropTypes.object,
  model: PropTypes.object,
  onChange: PropTypes.func,
  indexPatternForQuery: PropTypes.string,
  seriesQuantity: PropTypes.object,
};
