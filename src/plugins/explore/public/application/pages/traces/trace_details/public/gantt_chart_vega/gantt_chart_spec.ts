/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spec } from 'vega';
import { i18n } from '@osd/i18n';
import { GANTT_CHART_CONSTANTS, calculateTextPadding } from './gantt_constants';

function createTooltipSignal(isEmbedded: boolean): string {
  const embeddedMessage = isEmbedded
    ? "'" +
      i18n.translate('explore.ganttChart.tooltip.action', {
        defaultMessage: 'Action',
      }) +
      "': '" +
      i18n.translate('explore.ganttChart.tooltip.clickToViewDetails', {
        defaultMessage: 'click to view span details',
      }) +
      "', "
    : '';

  const baseTooltip =
    "'" +
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
    "': datum.startTime + ' ms'";

  return `{${embeddedMessage}${baseTooltip}}`;
}

export function createGanttSpec(
  height: number,
  dataLength: number = 0,
  containerWidth: number = 800,
  selectedSpanId?: string,
  isDarkMode: boolean = false,
  isEmbedded?: boolean
): Spec {
  const textPadding = calculateTextPadding(containerWidth);
  const isEmbeddedMode = isEmbedded || false;

  // Calculate proper height based on number of spans
  const calculatedHeight = Math.max(
    height,
    dataLength * GANTT_CHART_CONSTANTS.MIN_ROW_HEIGHT +
      GANTT_CHART_CONSTANTS.BASE_CALCULATION_HEIGHT
  );
  const chartHeight = calculatedHeight;

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Trace spans Gantt chart',
    autosize: { type: 'fit', resize: false, contains: 'padding' },
    width: containerWidth,
    height: chartHeight,
    padding: GANTT_CHART_CONSTANTS.PADDING,

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
              signal: createTooltipSignal(isEmbeddedMode),
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
            fillOpacity: selectedSpanId
              ? { signal: `datum.spanId === '${selectedSpanId}' ? 1.0 : 0.4` }
              : { value: 1.0 },
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
            x: { value: 5 }, // Position after serviceName text (which ends at x: -5)
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
            text: {
              signal:
                'length(datum.serviceName) > ' +
                GANTT_CHART_CONSTANTS.TEXT_TRUNCATE_THRESHOLD +
                ' ? slice(datum.serviceName, 0, ' +
                GANTT_CHART_CONSTANTS.TEXT_TRUNCATE_HEAD_LENGTH +
                ") + '…' + slice(datum.serviceName, -" +
                GANTT_CHART_CONSTANTS.TEXT_TRUNCATE_TAIL_LENGTH +
                ') : datum.serviceName',
            },
            x: { value: -5 },
            align: { value: 'right' },
            limit: { value: textPadding - 5 }, // Use full left padding space
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
            text: {
              signal:
                'length(datum.name) > ' +
                GANTT_CHART_CONSTANTS.TEXT_TRUNCATE_THRESHOLD +
                ' ? slice(datum.name, 0, ' +
                GANTT_CHART_CONSTANTS.TEXT_TRUNCATE_HEAD_LENGTH +
                ") + '…' + slice(datum.name, -" +
                GANTT_CHART_CONSTANTS.TEXT_TRUNCATE_TAIL_LENGTH +
                ') : datum.name',
            },
            x: { value: -5 },
            align: { value: 'right' },
            limit: { value: textPadding - 5 }, // Use full left padding space
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
            cursor: { value: 'pointer' },
            tooltip: {
              signal: createTooltipSignal(isEmbeddedMode),
            },
          },
          update: {
            x: { scale: 'xscale', field: 'startTime', offset: -5 },
          },
          hover: {
            fill: { value: '#555' },
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
            cursor: { value: 'pointer' },
            tooltip: {
              signal: createTooltipSignal(isEmbeddedMode),
            },
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
          hover: {
            fill: {
              signal: `datum.hasError ? "#d14a2a" : "${isDarkMode ? '#cccccc' : '#333333'}"`,
            },
          },
        },
      },
    ],
  };
}
