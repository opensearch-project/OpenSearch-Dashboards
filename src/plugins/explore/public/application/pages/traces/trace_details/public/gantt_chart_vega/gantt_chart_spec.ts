/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Spec } from 'vega';

export function createGanttSpec(
  height: number,
  dataLength: number = 0,
  containerWidth: number = 800,
  maxLabelWidth: number = 80
): Spec {
  const leftPadding = Math.max(60, Math.min(90, containerWidth * 0.08));
  const rightPadding = 50;
  const effectiveWidth = containerWidth - leftPadding - rightPadding;

  // Calculate proper height based on number of spans
  const minRowHeight = 30;
  const calculatedHeight = Math.max(height, dataLength * minRowHeight + 100);
  const chartHeight = calculatedHeight - 60; // Account for top/bottom padding

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Trace spans Gantt chart',
    autosize: { type: 'fit', resize: true },
    width: effectiveWidth,
    height: chartHeight,
    padding: { left: leftPadding, right: rightPadding, top: 30, bottom: 30 },

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
        title: 'Time (ms)',
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
            stroke: { value: 'white' },
            strokeWidth: { value: 1 },
            tooltip: {
              signal:
                "datum.hasError ? {'⚠️ Error': 'click for details', 'Service': datum.serviceName, 'Name': datum.name, 'Duration': datum.duration + ' ms', 'Start': datum.startTime + ' ms'} : {'Service': datum.serviceName, 'Name': datum.name, 'Duration': datum.duration + ' ms', 'Start': datum.startTime + ' ms'}",
            },
            cursor: { value: 'pointer' },
          },
          update: {
            x: { scale: 'xscale', field: 'startTime' },
            x2: { scale: 'xscale', field: 'endTime' },
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
            tooltip: { signal: "'Error in span'" },
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
            fill: { value: '#000' },
            text: { field: 'serviceName' },
            x: { value: -5 },
            align: { value: 'right' },
            limit: { value: leftPadding - 8 }, // Aggressive truncation
          },
        },
      },
      // Operation name labels - optimized positioning with aggressive truncation
      {
        type: 'text',
        from: { data: 'spans' },
        encode: {
          enter: {
            y: { scale: 'yscale', field: 'label', band: 0.7 },
            fontSize: { value: 9 },
            baseline: { value: 'middle' },
            fill: { value: '#666' },
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
      // Duration labels
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
            text: { signal: 'datum.hasError ? "Error" : datum.duration + " ms"' },
            fill: { signal: 'datum.hasError ? "#c14125" : "#000"' },
          },
        },
      },
    ],
  };
}
