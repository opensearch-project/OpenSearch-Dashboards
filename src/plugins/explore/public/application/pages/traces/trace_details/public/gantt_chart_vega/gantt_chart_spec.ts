/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spec } from 'vega';
import { i18n } from '@osd/i18n';
import { GANTT_CHART_CONSTANTS, TOTAL_PADDING, calculateLeftPadding } from './gantt_constants';

export function createGanttSpec(
  height: number,
  dataLength: number = 0,
  containerWidth: number = 800,
  selectedSpanId?: string,
  isDarkMode: boolean = false
): Spec {
  const leftPadding = calculateLeftPadding(containerWidth);
  const effectiveWidth = containerWidth - leftPadding - GANTT_CHART_CONSTANTS.RIGHT_PADDING;

  // Calculate proper height based on number of spans
  const calculatedHeight = Math.max(
    height,
    dataLength * GANTT_CHART_CONSTANTS.MIN_ROW_HEIGHT +
      GANTT_CHART_CONSTANTS.BASE_CALCULATION_HEIGHT
  );
  const chartHeight = calculatedHeight - TOTAL_PADDING;

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Trace spans Gantt chart',
    autosize: { type: 'fit', resize: true },
    width: effectiveWidth,
    height: chartHeight,
    padding: {
      left: leftPadding,
      right: GANTT_CHART_CONSTANTS.RIGHT_PADDING,
      top: GANTT_CHART_CONSTANTS.TOP_PADDING,
      bottom: GANTT_CHART_CONSTANTS.BOTTOM_PADDING,
    },

    signals: [],

    data: [
      {
        name: 'spans',
        values: [],
        transform: [],
      },
      {
        name: 'error_spans',
        source: 'spans',
        transform: [
          {
            type: 'filter',
            expr: 'datum.hasError',
          },
        ],
      },
    ],

    scales: [
      {
        name: 'xscale',
        type: 'linear',
        range: 'width',
        domain: { data: 'spans', fields: ['startTime', 'endTime'] },
        zero: false,
        nice: true,
        padding: 5,
      },
      {
        name: 'yscale',
        type: 'band',
        range: 'height',
        domain: { data: 'spans', field: 'label' },
        padding: 0.1,
        reverse: true,
      },
    ],

    axes: [
      {
        scale: 'xscale',
        orient: 'top',
        grid: true,
        tickCount: 8,
        title: i18n.translate('explore.ganttChart.axis.timeTitle', {
          defaultMessage: 'Time (ms)',
        }),
        titleFontSize: 12,
        labelFontSize: 10,
        encode: {
          grid: {
            enter: {
              stroke: { value: '#e0e0e0' },
              strokeWidth: { value: 1 },
            },
          },
        },
      },
      {
        scale: 'yscale',
        orient: 'left',
        grid: false,
        domain: false,
        labels: false,
        ticks: false,
        title: '',
      },
    ],

    marks: [
      // Main span bars
      {
        type: 'rect',
        from: { data: 'spans' },
        encode: {
          enter: {
            y: { scale: 'yscale', field: 'label' },
            height: { scale: 'yscale', band: 1.0 }, // 1.0 for text to be in middle
            fill: { field: 'color' },
            cursor: { value: 'pointer' },
            tooltip: {
              signal:
                "datum.hasError ? {'⚠️ " +
                i18n.translate('explore.ganttChart.tooltip.error', {
                  defaultMessage: 'Error',
                }) +
                "': '" +
                i18n.translate('explore.ganttChart.tooltip.clickForDetails', {
                  defaultMessage: 'click for details',
                }) +
                "', '" +
                i18n.translate('explore.ganttChart.tooltip.service', {
                  defaultMessage: 'Service',
                }) +
                "': datum.serviceName, '" +
                i18n.translate('explore.ganttChart.tooltip.name', { defaultMessage: 'Name' }) +
                "': datum.name, '" +
                i18n.translate('explore.ganttChart.tooltip.duration', {
                  defaultMessage: 'Duration',
                }) +
                "': datum.duration + ' ms', '" +
                i18n.translate('explore.ganttChart.tooltip.start', { defaultMessage: 'Start' }) +
                "': datum.startTime + ' ms'} : {'" +
                i18n.translate('explore.ganttChart.tooltip.service', {
                  defaultMessage: 'Service',
                }) +
                "': datum.serviceName, '" +
                i18n.translate('explore.ganttChart.tooltip.name', { defaultMessage: 'Name' }) +
                "': datum.name, '" +
                i18n.translate('explore.ganttChart.tooltip.duration', {
                  defaultMessage: 'Duration',
                }) +
                "': datum.duration + ' ms', '" +
                i18n.translate('explore.ganttChart.tooltip.start', { defaultMessage: 'Start' }) +
                "': datum.startTime + ' ms'}",
            },
          },
          update: {
            x: { scale: 'xscale', field: 'startTime' },
            x2: { scale: 'xscale', field: 'endTime' },
            stroke: selectedSpanId
              ? {
                  signal: `datum.spanId === '${selectedSpanId}' ? '${
                    isDarkMode ? '#ffffff' : '#000000'
                  }' : '${isDarkMode ? '#333333' : '#ffffff'}'`,
                }
              : { value: isDarkMode ? '#333333' : '#ffffff' },
            strokeWidth: selectedSpanId
              ? { signal: `datum.spanId === '${selectedSpanId}' ? 3 : 1` }
              : { value: 1 },
          },
          hover: {
            fillOpacity: { value: 0.8 },
          },
        },
      },
      // Error indicators
      {
        type: 'symbol',
        from: { data: 'error_spans' },
        encode: {
          enter: {
            y: { scale: 'yscale', field: 'label', band: 0.5 },
            size: { value: 120 },
            shape: { value: 'triangle-up' },
            fill: { value: '#c14125' },
            stroke: { value: 'white' },
            strokeWidth: { value: 1 },
            tooltip: {
              signal:
                "'" +
                i18n.translate('explore.ganttChart.tooltip.errorInSpan', {
                  defaultMessage: 'Error in span',
                }) +
                "'",
            },
          },
          update: {
            x: { scale: 'xscale', field: 'endTime' },
          },
        },
      },
      {
        type: 'text',
        from: { data: 'spans' },
        encode: {
          enter: {
            y: { scale: 'yscale', field: 'label', band: 0.3 },
            fontSize: { value: 10 },
            fontWeight: { value: 'bold' },
            baseline: { value: 'middle' },
            fill: { value: isDarkMode ? '#ffffff' : '#000000' },
            text: { field: 'serviceName' },
            x: { value: -5 },
            align: { value: 'right' },
            limit: { value: leftPadding - 8 }, // Aggressive truncation
          },
        },
      },
      // Operation name labels
      {
        type: 'text',
        from: { data: 'spans' },
        encode: {
          enter: {
            y: { scale: 'yscale', field: 'label', band: 0.7 },
            fontSize: { value: 9 },
            baseline: { value: 'middle' },
            fill: { value: isDarkMode ? '#cccccc' : '#666666' },
            text: { field: 'name' },
            x: { value: -5 },
            align: { value: 'right' },
            limit: { value: leftPadding - 8 }, // Aggressive truncation
          },
        },
      },
      // Start time labels - positioned to the left of bars
      {
        type: 'text',
        from: { data: 'spans' },
        encode: {
          enter: {
            y: { scale: 'yscale', field: 'label', band: 0.5 },
            fontSize: { value: 8 },
            baseline: { value: 'middle' },
            fill: { value: '#888' },
            text: { signal: 'format(datum.startTime, ".2f") + " ms"' },
            align: { value: 'right' },
            fontStyle: { value: 'italic' },
          },
          update: {
            x: { scale: 'xscale', field: 'startTime', offset: -5 },
          },
        },
      },
      // Duration labels and errors on right
      {
        type: 'text',
        from: { data: 'spans' },
        encode: {
          enter: {
            y: { scale: 'yscale', field: 'label', band: 0.5 },
            fontSize: { value: 10 },
            fontWeight: { value: 'bold' },
            baseline: { value: 'middle' },
          },
          update: {
            x: { scale: 'xscale', field: 'endTime', offset: 8 },
            text: {
              signal:
                'datum.hasError ? "' +
                i18n.translate('explore.ganttChart.label.error', {
                  defaultMessage: 'Error',
                }) +
                '" : datum.duration + " ms"',
            },
            fill: {
              signal: `datum.hasError ? "#c14125" : "${isDarkMode ? '#ffffff' : '#000000'}"`,
            },
          },
        },
      },
    ],
  };
}
