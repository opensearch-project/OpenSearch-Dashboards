/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { PopoverAnchorPosition } from '@elastic/eui';
import { select, array, number, optionsKnob } from '@storybook/addon-knobs';
import { SelectTypeKnobValue } from '@storybook/addon-knobs/dist/components/types';
import { startCase, kebabCase } from 'lodash';

import {
  Rotation,
  Position,
  Placement,
  TooltipProps,
  SeriesType,
  BarSeries,
  LineSeries,
  AreaSeries,
  BubbleSeries,
  TooltipStickTo,
} from '../../src';
import { TooltipType } from '../../src/specs/constants';
import { VerticalAlignment, HorizontalAlignment } from '../../src/utils/common';

export const getPositiveNumberKnob = (name: string, value: number, groupId?: string) =>
  number(name, value, { min: 0 }, groupId);

export const numberSelect = <T extends number>(
  name: string,
  options: { [s: string]: T },
  value: T,
  groupId?: string,
): T => (parseInt(select<T | string>(name, options, value, groupId) as string, 10) as T) || value;

export const getChartRotationKnob = () =>
  numberSelect<Rotation>(
    'chartRotation',
    {
      '0 deg': 0,
      '90 deg': 90,
      '-90 deg': -90,
      '180 deg': 180,
    },
    0,
  );

export const getTooltipTypeKnob = (
  name = 'tooltip type',
  defaultValue: TooltipType = TooltipType.VerticalCursor,
  groupId?: string,
) =>
  select<TooltipType>(
    name,
    {
      Vertical: TooltipType.VerticalCursor,
      Follow: TooltipType.Follow,
      Crosshairs: TooltipType.Crosshairs,
      None: TooltipType.None,
    },
    defaultValue,
    groupId,
  );

/**
 * Generates storybook knobs from const enum
 *
 * TODO: cleanup types to infer T
 */
export const getKnobsFromEnum = <T extends SelectTypeKnobValue, O extends Record<keyof O, T>>(
  name: string,
  options: O,
  defaultValue: T,
  {
    group,
    allowUndefined,
    include,
    exclude,
  }: {
    group?: string;
    allowUndefined?: boolean;
    include?: Array<T>;
    exclude?: Array<T>;
  } = {},
): T | undefined =>
  select<T>(
    name,
    (Object.entries<T>(options) as [keyof O, T][])
      .filter(([, v]) => !include || include.includes(v))
      .filter(([, v]) => !exclude || !exclude.includes(v))
      .reduce<O>((acc, [key, value]) => {
        // @ts-ignore
        acc[startCase(kebabCase(key))] = value;
        return acc;
      }, (allowUndefined ? { Undefined: undefined } : ({} as unknown)) as O),
    defaultValue,
    group,
  ) || undefined;

export const getPositionKnob = (name = 'chartRotation', defaultValue: Position = Position.Right) =>
  select<Position>(
    name,
    {
      Right: Position.Right,
      Left: Position.Left,
      Top: Position.Top,
      Bottom: Position.Bottom,
    },
    defaultValue,
  );

export const getPlacementKnob = (name = 'placement', defaultValue?: Placement, groupId?: string) => {
  const value = select<Placement | undefined>(
    name,
    {
      Default: undefined,
      Top: Placement.Top,
      Bottom: Placement.Bottom,
      Left: Placement.Left,
      Right: Placement.Right,
      TopStart: Placement.TopStart,
      TopEnd: Placement.TopEnd,
      BottomStart: Placement.BottomStart,
      BottomEnd: Placement.BottomEnd,
      RightStart: Placement.RightStart,
      RightEnd: Placement.RightEnd,
      LeftStart: Placement.LeftStart,
      LeftEnd: Placement.LeftEnd,
      Auto: Placement.Auto,
      AutoStart: Placement.AutoStart,
      AutoEnd: Placement.AutoEnd,
    },
    defaultValue,
    groupId,
  );

  return value || undefined;
};

export const getStickToKnob = (name = 'stickTo', defaultValue = TooltipStickTo.MousePosition, groupId?: string) => {
  const value = select<TooltipStickTo | undefined>(
    name,
    {
      Default: undefined,
      ...TooltipStickTo,
    },
    defaultValue,
    groupId,
  );

  return value || undefined;
};

export const getEuiPopoverPositionKnob = (
  name = 'Popover position',
  defaultValue: PopoverAnchorPosition = 'leftCenter',
) =>
  select<PopoverAnchorPosition>(
    name,
    {
      upCenter: 'upCenter',
      upLeft: 'upLeft',
      upRight: 'upRight',
      downCenter: 'downCenter',
      downLeft: 'downLeft',
      downRight: 'downRight',
      leftCenter: 'leftCenter',
      leftUp: 'leftUp',
      leftDown: 'leftDown',
      rightCenter: 'rightCenter',
      rightUp: 'rightUp',
      rightDown: 'rightDown',
    },
    defaultValue,
  );

export function arrayKnobs(name: string, values: (string | number)[]): (string | number)[] {
  const stringifiedValues = values.map<string>((d) => `${d}`);
  return array(name, stringifiedValues).map<string | number>((value: string) =>
    !isNaN(parseFloat(value)) ? parseFloat(value) : value,
  );
}

export const getFallbackPlacementsKnob = (): Placement[] | undefined => {
  const knob = optionsKnob<Placement>(
    'Fallback Placements',
    {
      Top: Placement.Top,
      Bottom: Placement.Bottom,
      Left: Placement.Left,
      Right: Placement.Right,
      TopStart: Placement.TopStart,
      TopEnd: Placement.TopEnd,
      BottomStart: Placement.BottomStart,
      BottomEnd: Placement.BottomEnd,
      RightStart: Placement.RightStart,
      RightEnd: Placement.RightEnd,
      LeftStart: Placement.LeftStart,
      LeftEnd: Placement.LeftEnd,
      Auto: Placement.Auto,
      AutoStart: Placement.AutoStart,
      AutoEnd: Placement.AutoEnd,
    },
    [Placement.Right, Placement.Left, Placement.Top, Placement.Bottom],
    {
      display: 'multi-select',
    },
  );

  if (typeof knob === 'string') {
    // @ts-ignore
    return knob.split(', ');
  }

  // @ts-ignore
  if (knob.length === 0) {
    return;
  }

  return knob;
};

const boundaryMap: Record<string, TooltipProps['boundary'] | null> = {
  default: undefined,
  chart: 'chart',
};

export const getBoundaryKnob = () => {
  const boundaryString =
    select<string>(
      'Boundary Element',
      {
        Default: 'default',
        Chart: 'chart',
      },
      'default',
    ) ?? '';

  return boundaryMap[boundaryString] ?? undefined;
};

export const getVerticalTextAlignmentKnob = (group?: string) =>
  select<VerticalAlignment | undefined>(
    'Vertical Text alignment',
    {
      None: undefined,
      Middle: VerticalAlignment.Middle,
      Top: VerticalAlignment.Top,
      Bottom: VerticalAlignment.Bottom,
      Near: VerticalAlignment.Near,
      Far: VerticalAlignment.Far,
    },
    undefined,
    group,
  ) || undefined;

export const getHorizontalTextAlignmentKnob = (group?: string) =>
  select<HorizontalAlignment | undefined>(
    'Horizontal Text alignment',
    {
      None: undefined,
      Center: HorizontalAlignment.Center,
      Left: HorizontalAlignment.Left,
      Right: HorizontalAlignment.Right,
      Near: HorizontalAlignment.Near,
      Far: HorizontalAlignment.Far,
    },
    undefined,
    group,
  ) || undefined;

const seriesTypeMap = {
  [SeriesType.Bar]: BarSeries,
  [SeriesType.Line]: LineSeries,
  [SeriesType.Area]: AreaSeries,
  [SeriesType.Bubble]: BubbleSeries,
};
export const getXYSeriesTypeKnob = (group?: string, ignore: SeriesType[] = []) => {
  const spectType = select<SeriesType>(
    'SeriesType',
    Object.fromEntries(Object.entries(SeriesType).filter(([, type]) => !ignore.includes(type))),
    SeriesType.Bar,
    group,
  );

  return seriesTypeMap[spectType];
};
