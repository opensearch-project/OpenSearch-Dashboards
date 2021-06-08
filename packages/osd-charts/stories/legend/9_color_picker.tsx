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

import { EuiColorPicker, EuiWrappingPopover, EuiButton, EuiSpacer, EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';
import { action } from '@storybook/addon-actions';
import React, { useState, useMemo } from 'react';

import {
  Axis,
  BarSeries,
  Chart,
  Position,
  ScaleType,
  Settings,
  LegendColorPicker,
  Color,
  SeriesKey,
  toEntries,
} from '../../packages/charts/src';
import { BARCHART_1Y1G } from '../../packages/charts/src/utils/data_samples/test_dataset';

const onChangeAction = action('onChange');
const onCloseAction = action('onClose');

export const Example = () => {
  const [colors, setColors] = useState<Record<SeriesKey, Color | null>>({});
  const CustomColorPicker: LegendColorPicker = useMemo(
    () => ({ anchor, color, onClose, seriesIdentifiers, onChange }) => {
      const handleClose = () => {
        onClose();
        onCloseAction();
        setColors((prevColors) => ({
          ...prevColors,
          ...toEntries(seriesIdentifiers, 'key', color),
        }));
      };
      const handleChange = (c: Color | null) => {
        setColors((prevColors) => ({
          ...prevColors,
          ...toEntries(seriesIdentifiers, 'key', c),
        }));
        onChange(c);
        onChangeAction(c);
      };

      return (
        <>
          <EuiWrappingPopover isOpen button={anchor} closePopover={handleClose} anchorPosition="leftCenter" ownFocus>
            <EuiColorPicker display="inline" color={color} onChange={handleChange} />
            <EuiSpacer size="m" />
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="s" onClick={() => handleChange(null)}>
                Clear color
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiButton fullWidth size="s" onClick={handleClose}>
              Done
            </EuiButton>
          </EuiWrappingPopover>
        </>
      );
    },
    [setColors],
  );
  CustomColorPicker.displayName = 'CustomColorPicker';
  return (
    <Chart className="story-chart">
      <Settings showLegend legendColorPicker={CustomColorPicker} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d: any) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars 1"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        splitSeriesAccessors={['g']}
        data={BARCHART_1Y1G}
        color={({ key }) => colors[key] ?? null}
      />
    </Chart>
  );
};

Example.story = {
  parameters: {
    info: {
      text:
        'Elastic charts will maintain the color selection in memory beyond chart updates. However, to persist colors beyond browser refresh the consumer would need to manage the color state and use the color prop on the SeriesSpec to assign a color via a SeriesColorAccessor.\n\n __Note:__ the context menu, color picker and popover are supplied by [eui](https://elastic.github.io/eui/#).',
    },
  },
};
