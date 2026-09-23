/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import DOMPurify from 'dompurify';
import { escape } from 'lodash';
import type { BaseChartStyle } from './echarts_spec';
import { StackMode, VisColumn, AxisRole, VisFieldType } from '../types';
import { resolveStackMode } from './data_transformation';
import { formatUnitValue } from '../style_panel/unit/collection';
import { formatSeriesValueLabel } from './utils';
import { normalizeEmptyValue } from './data_transformation';

export interface TooltipRow {
  marker?: string;
  label: unknown;
  value: unknown;
}

export interface TooltipContent {
  title?: unknown;
  rows: TooltipRow[];
}

export interface TooltipFormatContext<T extends BaseChartStyle = BaseChartStyle> {
  styles: T;
  seriesDisplayNames?: Record<string, string>;
  axesMappingEncode?: {
    categoryEncode?: string;
    valueEncode?: string;
  };
  formatValue: (value: unknown) => string;
  getDisplayName: (value: unknown) => string;
  renderTooltipContent: (content: TooltipContent) => string;
}

export type TooltipFormatFn<T extends BaseChartStyle = BaseChartStyle> = (
  context: TooltipFormatContext<T>
) => (echartsParams: any) => string;

export const resolveDisplayName =
  (seriesDisplayNames?: Record<string, string>) =>
  (value: unknown): string => {
    const key = String(value ?? '');
    return seriesDisplayNames?.[key] ?? key;
  };

export const escapeTooltipText = (value: unknown) => escape(String(value ?? ''));

export const formatTooltipTitle = (title: string) =>
  `<div style="
            overflow-wrap:anywhere;
            white-space:normal;
        ">
            ${escapeTooltipText(title)}
        </div>`;

export const sanitizeTooltipHtml = (html: string) => DOMPurify.sanitize(html);

const formatTooltipLine = ({ marker, label, value }: TooltipRow) =>
  `<div style="display:flex;justify-content:space-between;align-items:flex-start;">` +
  `<span style="flex:0 0 auto;">${marker ?? ''}</span>` +
  `<div style="
            min-width:0;
            flex:1;
            overflow-wrap:anywhere;
            white-space:normal;
        ">
            ${escapeTooltipText(label)}
        </div>` +
  `<strong style="margin-left:12px;text-align:right;white-space:nowrap;font-weight:600;">${escapeTooltipText(
    value
  )}</strong>` +
  `</div>`;

export const renderTooltipContent = ({ title, rows }: TooltipContent) => {
  return sanitizeTooltipHtml(
    [formatTooltipTitle(String(title ?? '')), ...rows.map((row) => formatTooltipLine(row))]
      .filter(Boolean)
      .join('')
  );
};

const normalizeValue = (value: unknown): unknown[] => (Array.isArray(value) ? value : [value]);

export const createTooltipValueFormatter = <T extends BaseChartStyle>({
  styles,
}: {
  styles: T;
}) => {
  const hasUnit = !!styles.unitId || styles.decimals != null || !!styles.unitSuffix;
  const isPercentage =
    resolveStackMode(styles as BaseChartStyle & { stackMode?: StackMode }) === 'percentage';

  return (value: unknown) =>
    normalizeValue(value)
      .map((item) =>
        isPercentage
          ? formatSeriesValueLabel(item, true, styles.decimals)
          : hasUnit && typeof item === 'number'
            ? formatUnitValue(item, styles.unitId, styles.decimals, styles.unitSuffix)
            : normalizeEmptyValue(value)
      )
      .join(' ');
};

const getEncodedValue = (row: any, axis?: string) => {
  if (!axis) return undefined;

  const index = row.encode?.[axis]?.[0];
  return row.value?.[index];
};

/**
 * Use this formatter when series display names come from a pivoted time-series chart.
 */
export const seriesDisplayNameTooltipFormatter: TooltipFormatFn =
  ({ formatValue, getDisplayName, axesMappingEncode, renderTooltipContent: renderContent }) =>
  (params: any) => {
    const rows = Array.isArray(params) ? params : [params];
    const valueAxis = axesMappingEncode?.valueEncode ?? 'y';
    const categoryAxis = axesMappingEncode?.categoryEncode ?? 'x';
    const categoryLabel = getEncodedValue(rows[0], categoryAxis);

    return renderContent({
      title: getDisplayName(formatTimeLabel(categoryLabel)),
      rows: rows.map((row: any) => {
        const value = getEncodedValue(row, valueAxis);
        return {
          marker: row.marker,
          label: getDisplayName(row.seriesName),
          value: formatValue(value),
        };
      }),
    });
  };

export const pieDisplayNameTooltipFormatter: TooltipFormatFn =
  ({ formatValue, getDisplayName, renderTooltipContent: renderContent }) =>
  (params: any) =>
    renderContent({
      rows: [
        {
          marker: params.marker,
          label: getDisplayName(params.name),
          value: formatValue(params.value),
        },
      ],
    });

export const heatmapTooltipFormatter: TooltipFormatFn =
  ({ renderTooltipContent: renderContent }) =>
  (params: any) => {
    // dimensionNames is like : [ "OriginWeather", "DestWeather", "avg_delay" ]
    // tooltipEncode is like: { "x":[0], "y":[1], "value":[2]}
    const dimensionNames: string[] = params.dimensionNames ?? [];
    const tooltipEncode = params.encode;

    return renderContent({
      rows: Object.keys(tooltipEncode).map((encode) => {
        const indexOfEncode = tooltipEncode[encode][0];
        return {
          marker: params.marker,
          label: dimensionNames[indexOfEncode],
          value: getEncodedValue(params, encode),
        };
      }),
    });
  };

export const stateTimelineTooltipFormatter =
  ({ groupField }: { groupField?: string }): TooltipFormatFn =>
  ({ getDisplayName, renderTooltipContent: renderContent }) =>
  (params: any) => {
    const dimensionNames: string[] = params.dimensionNames ?? [];
    const valueOf = (field: string) => params.value?.[dimensionNames.indexOf(field)];

    const commonRows = [
      { label: 'start', value: valueOf('start') },
      { label: 'end', value: valueOf('end') },
      { label: 'duration', value: valueOf('duration') },
      { label: 'count', value: valueOf('mergedCount') },
    ];

    if (groupField) {
      const groupValue = valueOf(groupField);

      return renderContent({
        rows: [
          {
            label: getDisplayName(groupValue),
            value: '',
          },
          {
            marker: params.marker,
            label: params.seriesName,
            value: '',
          },
          ...commonRows,
        ],
      });
    }

    return renderContent({
      rows: [
        {
          marker: params.marker,
          label: getDisplayName(params.seriesName),
          value: '',
        },
        ...commonRows,
      ],
    });
  };

const isCategoryLikeAxis = (axis?: VisColumn) =>
  axis?.schema === VisFieldType.Categorical || axis?.schema === VisFieldType.Date;

const isValueAxis = (axis?: VisColumn) => axis?.schema === VisFieldType.Numerical;

export const getTooltipAxesMappingEncode = (axisColumnMappings: {
  [K in AxisRole]?: VisColumn | VisColumn[];
}): TooltipFormatContext['axesMappingEncode'] => {
  const xAxis = axisColumnMappings[AxisRole.X];
  const yAxis = axisColumnMappings[AxisRole.Y];

  if (Array.isArray(xAxis) && !Array.isArray(yAxis)) {
    return { categoryEncode: 'y', valueEncode: 'x' };
  }

  if (Array.isArray(yAxis) && !Array.isArray(xAxis)) {
    return { categoryEncode: 'x', valueEncode: 'y' };
  }

  const getFirstAxisColumn = (axis?: VisColumn | VisColumn[]) =>
    Array.isArray(axis) ? axis[0] : axis;

  const xColumn = getFirstAxisColumn(xAxis);
  const yColumn = getFirstAxisColumn(yAxis);

  if (isValueAxis(xColumn) && isCategoryLikeAxis(yColumn)) {
    return { categoryEncode: 'y', valueEncode: 'x' };
  }

  if (isCategoryLikeAxis(xColumn) && isValueAxis(yColumn)) {
    return { categoryEncode: 'x', valueEncode: 'y' };
  }

  return { categoryEncode: 'x', valueEncode: 'y' };
};

const padDatePart = (value: number) => String(value).padStart(2, '0');

// After aggregate() rounds a time field with roundToTimeUnit(), the tooltip category value is
// a Date object. Format it here instead of rendering Date.toString().
export const formatTimeLabel = (value: unknown) => {
  if (!(value instanceof Date) || isNaN(value.getTime())) {
    return value;
  }

  const year = value.getFullYear();
  const month = padDatePart(value.getMonth() + 1);
  const day = padDatePart(value.getDate());
  const hours = padDatePart(value.getHours());
  const minutes = padDatePart(value.getMinutes());
  const seconds = padDatePart(value.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
