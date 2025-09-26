/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getColors } from '../theme/default_colors';

interface Field {
  name: string;
  type: string;
  title?: string;
  format?: string;
  stack?: boolean | string;
}

interface AxisConfig {
  x: Field;
  y: Field | Field[];
  y1?: Field | Field[];
  color?: Field;
}

interface Options {
  showTooltip: boolean;
  data?: Array<Record<string, any>>;
}

function createTooltip(fields: Field[]) {
  const tooltip = fields.map((f) => {
    return {
      field: f.name,
      type: f.type,
      title: f.title,
      ...(f.format && { format: f.format }),
    };
  });
  return tooltip;
}

function createPointLayer(xField: Field, yFields: Field[], colorField?: Field) {
  let color = null;
  if (colorField) {
    color = { field: colorField.name, type: colorField.type };
  }

  let y = null;
  if (yFields.length === 1) {
    y = { field: yFields[0].name, type: yFields[0].type, stack: yFields[0].stack };
  }

  const pointLayerTransform: any[] = [];
  if (yFields.length > 1) {
    pointLayerTransform.push({
      fold: yFields.map((f) => f.name),
      as: ['key', 'value'],
    });
    color = { field: 'key', type: 'nominal' };
    y = { field: 'value', type: 'quantitative' };
  }

  const marks = [
    {
      type: 'point',
      shape: 'circle',
      size: 60,
      filled: true,
    },
    {
      type: 'point',
      shape: 'circle',
      size: 60,
      stroke: '#fff',
      strokeWidth: 1,
      filled: false,
      fill: '',
    },
    {
      type: 'point',
      shape: 'circle',
      size: 90,
      strokeWidth: 3,
      filled: false,
      fill: '',
      strokeOpacity: 0.5,
    },
  ];

  const pointLayers = marks.map((mark) => ({
    mark,
    transform: pointLayerTransform,
    encoding: {
      x: { field: xField.name, type: xField.type },
      y,
      color,
      opacity: {
        condition: { param: 'hover', value: 1, empty: false },
        value: 0,
      },
    },
  }));

  return { layer: pointLayers };
}

function createHiddenBarLayer(axisConfig: AxisConfig, options: Options & { barOpacity: number }) {
  const barOpacity = options.barOpacity;
  const colors = getColors();
  const hiddenBarLayerTransform = [];
  let tooltip = null;

  const yFields = Array<Field>().concat(axisConfig.y);
  const y1Fields = Array<Field>().concat(axisConfig.y1 ? axisConfig.y1 : []);

  if (axisConfig.color && !Array.isArray(axisConfig.y)) {
    hiddenBarLayerTransform.push({
      pivot: axisConfig.color.name,
      value: axisConfig.y.name,
      groupby: [axisConfig.x.name],
    });
  }

  if (options.showTooltip) {
    if (axisConfig.color && !Array.isArray(axisConfig.y)) {
      const uniqueColorFieldValues = new Set(
        (options.data ?? []).map((d) => d[axisConfig.color?.name ?? ''])
      );
      tooltip = createTooltip([
        axisConfig.x,
        ...[...uniqueColorFieldValues].map((v) => ({
          name: v,
          type: (axisConfig.y as Field).type,
        })),
      ]);
    } else {
      tooltip = createTooltip([
        axisConfig.x,
        ...yFields,
        ...y1Fields,
        ...(axisConfig.color ? [axisConfig.color] : []),
      ]);
    }
  }

  const hiddenBarLayer = {
    params: [
      {
        name: 'hover',
        select: {
          type: 'point',
          encodings: ['x'],
          on: 'mouseover',
          clear: 'mouseout',
          nearest: axisConfig.x.type === 'temporal',
        },
      },
    ],
    transform: hiddenBarLayerTransform,
    mark: {
      type: 'bar',
      color: colors.text,
    },
    encoding: {
      x: { field: axisConfig.x.name, type: axisConfig.x.type },
      opacity: {
        condition: { param: 'hover', value: barOpacity, empty: false },
        value: 0,
      },
      tooltip,
    },
  };
  return hiddenBarLayer;
}

export function createCrosshairLayers(axisConfig: AxisConfig, options: Options) {
  const colors = getColors();
  const layers = [];
  const yFields = Array<Field>().concat(axisConfig.y);

  if (axisConfig.y1) {
    const y1Fields = Array<Field>().concat(axisConfig.y1);
    const pointLayer1 = createPointLayer(axisConfig.x, y1Fields, axisConfig.color);
    layers.push(pointLayer1);
  }

  layers.push(createHiddenBarLayer(axisConfig, { ...options, barOpacity: 0 }));

  const ruleLayers = [];
  const xRuleLayer = {
    mark: { type: 'rule', color: colors.text, strokeDash: [3, 3] },
    encoding: {
      x: { field: axisConfig.x.name, type: axisConfig.x.type },
      opacity: {
        condition: { param: 'hover', value: 1, empty: false },
        value: 0,
      },
    },
  };
  ruleLayers.push(xRuleLayer);

  if (!axisConfig.color && yFields.length === 1) {
    const yRuleLayer = {
      mark: { type: 'rule', color: colors.text, strokeDash: [3, 3] },
      encoding: {
        y: { field: yFields[0].name, type: yFields[0].type },
        opacity: {
          condition: { param: 'hover', value: 1, empty: false },
          value: 0,
        },
      },
    };
    ruleLayers.push(yRuleLayer);
  }
  layers.push({ layer: ruleLayers });

  const pointLayer = createPointLayer(axisConfig.x, yFields, axisConfig.color);
  layers.push(pointLayer);

  return layers;
}

export function createHighlightBarLayers(axisConfig: AxisConfig, options: Options) {
  const layers = [];
  const yFields = Array<Field>().concat(axisConfig.y);
  const y1Fields = Array<Field>().concat(axisConfig.y1 ? axisConfig.y1 : []);

  const pointLayer = createPointLayer(axisConfig.x, yFields, axisConfig.color);
  layers.push(pointLayer);

  if (y1Fields.length > 0) {
    const pointLayer1 = createPointLayer(axisConfig.x, y1Fields, axisConfig.color);
    layers.push(pointLayer1);
  }

  layers.push(createHiddenBarLayer(axisConfig, { ...options, barOpacity: 0.1 }));

  return layers;
}
