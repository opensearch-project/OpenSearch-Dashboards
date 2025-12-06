/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieChartStyle } from './pie_vis_config';
import { VisColumn, VEGASCHEMA, AxisColumnMappings, AxisRole } from '../types';
import { DEFAULT_OPACITY } from '../constants';
import { DEFAULT_DARK_GREY, DEFAULT_GREY } from '../theme/default_colors';

export const createPieSpec = (
  transformedData: Array<Record<string, any>>,
  numericalColumns: VisColumn[],
  categoricalColumns: VisColumn[],
  dateColumns: VisColumn[],
  styleOptions: PieChartStyle,
  axisColumnMappings?: AxisColumnMappings
) => {
  const colorColumn = axisColumnMappings?.[AxisRole.COLOR];
  const thetaColumn = axisColumnMappings?.[AxisRole.SIZE];

  const numericField = thetaColumn?.column;
  const numericName = thetaColumn?.name;
  const categoryField = colorColumn?.column;
  const categoryName = colorColumn?.name;

  const params = [
    { name: 'stepSize', expr: 'min(width, height) / 20' },
    { name: 'centerX', expr: 'width/2' },
    { name: 'centerY', expr: 'height/2' },
    { name: 'radiusRef', expr: 'min(width/2, height/2)' },
    { name: 'outerRadius', expr: 'radiusRef * 0.7' },
    { name: 'innerRadius', expr: 'outerRadius - outerRadius * 0.25' },
    {
      name: 'labelFontSize',
      expr: 'stepSize/2.5',
    },
    {
      name: 'labelHeight',
      expr: 'labelFontSize',
    },
    {
      name: 'labelDisplay',
      expr: `${styleOptions.exclusive.showLabels && styleOptions.exclusive.showValues}
          ? 'all'
          : ${styleOptions.exclusive.showLabels}
          ? 'onlyLables'
          : 'onlyValues'`,
    },
  ];

  const transformLayer = [
    {
      window: [{ op: 'sum', field: numericField, as: 'cum' }],
      sort: [{ field: categoryField, order: 'ascending' }],
    },

    { joinaggregate: [{ op: 'sum', field: numericField, as: 'total' }] },
    {
      calculate: `(datum.cum - datum['${numericField}']/2) / datum.total * 2 * PI - PI/2`,
      as: 'midAngle',
    },
    {
      calculate: "datum.midAngle + PI/2  <= PI || datum.midAngle + PI/2 >= 2*PI ?'right':'left'",
      as: 'side',
    },
    { calculate: `2 * PI * (datum.cum - datum['${numericField}']) / datum.total`, as: 'myStart' },
    { calculate: '2 * PI * datum.cum / datum.total', as: 'myEnd' },

    { calculate: 'datum.myEnd-datum.myStart', as: 'myTheta' },

    { calculate: 'outerRadius * cos(datum.midAngle)+ centerX', as: 'path_x_0' },
    { calculate: 'outerRadius * sin(datum.midAngle)+ centerY', as: 'path_y_0' },
    { calculate: '(outerRadius+ stepSize) * cos(datum.midAngle) + centerX', as: 'path_x_1' },
    { calculate: '(outerRadius+ stepSize) * sin(datum.midAngle) + centerY', as: 'path_y_1' },
    {
      calculate:
        "datum.side== 'right'?outerRadius+(width/2)+(stepSize * 1.2):(width/2)-outerRadius-(stepSize * 1.2)",
      as: 'path_x_2',
    },
    {
      calculate:
        "datum.side== 'right'?outerRadius+(width/2)+(stepSize * 1.5):(width/2)-outerRadius-(stepSize * 1.5)",
      as: 'path_x_3',
    },

    {
      calculate:
        "datum.side== 'right'?outerRadius+(width/2)+(stepSize * 2):(width/2)-outerRadius-(stepSize * 2)",
      as: 'text_position',
    },

    // Compare gap_y_prev and gap_y_prev to decide if the end path slopes up or down
    // Use next_value and pre_value to decide if need the end path tail
    {
      window: [
        {
          op: 'lag',
          field: 'path_y_1',
          as: 'pre_y_value',
        },
        {
          op: 'lag',
          field: 'myTheta',
          as: 'pre_value',
        },
        {
          op: 'lead',
          field: 'path_y_1',
          as: 'next_y_value',
        },
        {
          op: 'lead',
          field: 'myTheta',
          as: 'next_value',
        },
      ],
      sort: [{ field: 'field-1', order: 'ascending' }],
    },

    {
      calculate: 'abs((datum.pre_y_value || 0) - datum.path_y_1)',
      as: 'gap_y_prev',
    },

    {
      calculate: 'abs((datum.next_y_value || 0) - datum.path_y_1)',
      as: 'gap_y_next',
    },

    {
      joinaggregate: [{ op: 'count', as: 'total_count_by_side' }],
      groupby: ['side'],
    },
    {
      window: [{ op: 'row_number', as: 'rowNumber' }],
      groupby: ['side'],
    },

    {
      calculate: '2 * PI / datum.total_count_by_side',
      as: 'proportion',
    },
    {
      calculate: `
    labelDisplay === 'all'
      ? datum['${categoryField}'] + ' ' + datum['${numericField}']
      : labelDisplay === 'onlyLables'
        ? datum['${categoryField}']
        : datum['${numericField}']
  `,
      as: 'finalLabel',
    },
  ];

  const markLayer = {
    params: [{ name: 'highlight', select: { type: 'point', on: 'pointerover' } }],
    mark: {
      type: 'arc',
      innerRadius: styleOptions.exclusive?.donut ? { expr: 'innerRadius' } : 0,
      radius: { expr: 'outerRadius' },
      tooltip: styleOptions?.tooltipOptions?.mode === 'all',
      padAngle: styleOptions.exclusive?.donut ? 0.01 : 0,
    },
    encoding: {
      y: { expr: 'centerY' },
      x: { expr: 'centerX' },
      theta: { field: 'myEnd', type: 'quantitative' },
      theta2: { field: 'myStart', type: 'quantitative' },
      color: {
        field: categoryField,
        // if color mapping is numerical, also treat it as nominal
        type: 'nominal',
        legend: styleOptions.addLegend
          ? {
              title: styleOptions.legendTitle,
              orient: styleOptions.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
      opacity: {
        value: DEFAULT_OPACITY,
        condition: { param: 'highlight', value: 1, empty: false },
      },
      ...(styleOptions.tooltipOptions?.mode !== 'hidden' && {
        tooltip: [
          { field: categoryField, type: 'nominal', title: categoryName },
          { field: numericField, type: 'quantitative', title: numericName },
        ],
      }),
    },
  };

  const hoverStateLayer = {
    mark: {
      type: 'arc',
      innerRadius: styleOptions.exclusive?.donut ? { expr: 'innerRadius' } : 0,
      radius: { expr: 'outerRadius*1.03' },
      padAngle: styleOptions.exclusive?.donut ? 0.01 : 0,
    },
    encoding: {
      opacity: {
        value: 0,
        condition: { param: 'highlight', value: DEFAULT_OPACITY / 3, empty: false },
      },
      theta: { field: 'myEnd', type: 'quantitative' },
      theta2: { field: 'myStart', type: 'quantitative' },
      color: {
        field: categoryField,
        // if color mapping is numerical, also treat it as nominal
        type: 'nominal',
        legend: styleOptions.addLegend
          ? {
              title: styleOptions.legendTitle,
              orient: styleOptions.legendPosition,
              symbolLimit: 10,
            }
          : null,
      },
    },
  };

  const labelLayer = [
    {
      transform: [
        {
          filter: 'datum.gap_y_prev > labelHeight || datum.gap_y_next >  labelHeight',
        },
        {
          calculate: 'datum.rowNumber === 1 ? true : false',
          as: 'isFirst',
        },
        {
          calculate: 'datum.rowNumber === datum.total_count_by_side ? true : false',
          as: 'isLast',
        },
        {
          calculate: "datum.side === 'right' ?  -5 : +5",
          as: 'minusFive',
        },
        {
          calculate:
            'datum.proportion < datum.myTheta || datum.proportion < datum.pre_value || datum.proportion < datum.next_value',
          as: 'test_conditon',
        },
        {
          calculate:
            'datum.isFirst ? datum.path_y_1 + datum.minusFive : datum.isLast ? datum.path_y_1 - datum.minusFive : (datum.test_conditon ) ? datum.path_y_1 : (datum.gap_y_next > datum.gap_y_prev) ? datum.path_y_1 - datum.minusFive : datum.path_y_1 + datum.minusFive',
          as: 'path_y_end',
        },
      ],

      layer: [
        {
          mark: { type: 'rule', color: DEFAULT_GREY },
          // explicitly remoe scale to enable pie chart and path share the absolute position
          encoding: {
            x: { field: 'path_x_0', type: 'quantitative', scale: null },
            y: { field: 'path_y_0', type: 'quantitative', scale: null },
            x2: { field: 'path_x_1', type: 'quantitative', scale: null },
            y2: { field: 'path_y_1', type: 'quantitative', scale: null },
          },
        },
        {
          mark: { type: 'rule', color: DEFAULT_GREY },
          encoding: {
            x: { field: 'path_x_1', type: 'quantitative', scale: null },
            y: { field: 'path_y_1', type: 'quantitative', scale: null },
            x2: { field: 'path_x_2', type: 'quantitative', scale: null },
          },
        },
        {
          mark: { type: 'rule', color: DEFAULT_GREY },
          encoding: {
            x: { field: 'path_x_2', type: 'quantitative', scale: null },
            y: { field: 'path_y_1', type: 'quantitative', scale: null },
            x2: { field: 'path_x_3', type: 'quantitative', scale: null },
            y2: { field: 'path_y_end', type: 'quantitative', scale: null },
          },
        },
        {
          mark: {
            type: 'text',
            color: DEFAULT_DARK_GREY,
            baseline: 'middle',
            fontSize: { expr: 'labelHeight' },
            lineHeight: 2,
            align: { signal: "datum.side=='left'?'right':'left'" },
            ...(styleOptions.exclusive?.truncate ? { limit: styleOptions.exclusive.truncate } : {}),
          },
          encoding: {
            x: { field: 'text_position', type: 'quantitative', scale: null },
            y: { field: 'path_y_end', type: 'quantitative', scale: null },
            text: { field: 'finalLabel' },
          },
        },
      ],
    },
  ];

  const baseSpec = {
    $schema: VEGASCHEMA,
    params,
    data: { values: transformedData },
    transform: transformLayer,
    layer: [
      markLayer,
      hoverStateLayer,
      ...(styleOptions.exclusive?.showValues || styleOptions.exclusive?.showLabels
        ? labelLayer
        : []),
    ].filter(Boolean),
    title: styleOptions.titleOptions?.show
      ? styleOptions.titleOptions?.titleName || `${numericName} by ${categoryName}`
      : undefined,
  };

  return baseSpec;
};
