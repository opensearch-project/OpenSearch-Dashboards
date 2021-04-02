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

import {
  EuiIcon,
  EuiPopover,
  EuiContextMenu,
  EuiContextMenuPanelDescriptor,
  EuiWrappingPopover,
  EuiColorPicker,
  EuiSpacer,
  EuiButton,
  PopoverAnchorPosition,
} from '@elastic/eui';
import { boolean } from '@storybook/addon-knobs';
import React, { useState } from 'react';

import {
  Axis,
  BarSeries,
  Chart,
  Position,
  ScaleType,
  Settings,
  LegendAction,
  XYChartSeriesIdentifier,
  LegendColorPicker,
} from '../../src';
import * as TestDatasets from '../../src/utils/data_samples/test_dataset';
import { getPositionKnob, getEuiPopoverPositionKnob } from '../utils/knobs';

const getAction = (anchorPosition: PopoverAnchorPosition): LegendAction => ({ series, label }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const getPanels = (series: XYChartSeriesIdentifier[]): EuiContextMenuPanelDescriptor[] => [
    {
      id: 0,
      title: label,
      items: [
        {
          name: 'Alert series specId',
          icon: <EuiIcon type="iInCircle" size="m" />,
          onClick: () => {
            setPopoverOpen(false);
            setTimeout(() => {
              window.alert(`Selected series: ${series.map(({ specId }) => specId).join(', ')}`);
            }, 100);
          },
        },
        {
          name: 'Alert series keys',
          icon: <EuiIcon type="tokenKey" size="m" />,
          onClick: () => {
            setPopoverOpen(false);
            setTimeout(() => {
              window.alert(`Selected series: [${series.map(({ seriesKeys }) => seriesKeys.join(', ')).join(' -- ')}]`);
            }, 100);
          },
        },
        {
          name: 'Filter series',
          icon: <EuiIcon type="filter" size="m" />,
          onClick: () => {
            setPopoverOpen(false);
            setTimeout(() => {
              window.alert('Series Filtered!');
            }, 100);
          },
        },
        {
          name: 'Like series',
          icon: <EuiIcon type="starFilled" size="m" />,
          onClick: () => {
            setPopoverOpen(false);
            setTimeout(() => {
              window.alert('Series liked!!!');
            }, 100);
          },
        },
      ],
    },
  ];

  const Button = (
    <button
      type="button"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 2,
        paddingRight: 2,
      }}
      onClick={() => setPopoverOpen(!popoverOpen)}
    >
      <EuiIcon size="s" type="pencil" />
    </button>
  );

  return (
    <EuiPopover
      id="contextMenuNormal"
      button={Button}
      isOpen={popoverOpen}
      closePopover={() => setPopoverOpen(false)}
      panelPaddingSize="none"
      offset={4}
      anchorPosition={anchorPosition}
      ownFocus
    >
      <EuiContextMenu initialPanelId={0} panels={getPanels(series as XYChartSeriesIdentifier[])} />
    </EuiPopover>
  );
};

const renderColorPicker = (anchorPosition: PopoverAnchorPosition): LegendColorPicker => ({
  anchor,
  color,
  onClose,
  onChange,
}) => (
  <EuiWrappingPopover isOpen button={anchor} closePopover={onClose} anchorPosition={anchorPosition} ownFocus>
    <EuiColorPicker display="inline" color={color} onChange={onChange} />
    <EuiSpacer size="m" />
    <EuiButton fullWidth size="s" onClick={onClose}>
      Done
    </EuiButton>
  </EuiWrappingPopover>
);

export const Example = () => {
  const hideActions = boolean('Hide legend action', false);
  const showLegendExtra = !boolean('Hide legend extra', false);
  const showColorPicker = !boolean('Hide color picker', true);
  const legendPosition = getPositionKnob('Legend position');
  const euiPopoverPosition = getEuiPopoverPositionKnob();

  return (
    <Chart className="story-chart">
      <Settings
        showLegend
        showLegendExtra={showLegendExtra}
        legendPosition={legendPosition}
        legendAction={hideActions ? undefined : getAction(euiPopoverPosition)}
        legendColorPicker={showColorPicker ? renderColorPicker(euiPopoverPosition) : undefined}
      />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks />
      <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

      <BarSeries
        id="bars"
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y1', 'y2']}
        splitSeriesAccessors={['g1', 'g2']}
        data={TestDatasets.BARCHART_2Y2G}
      />
    </Chart>
  );
};

Example.story = {
  parameters: {
    info: {
      text:
        'The `legendAction` action prop allows you to pass a render function/component that will render next to the legend item.\n\n __Note:__ the context menu, color picker and popover are supplied by [eui](https://elastic.github.io/eui/#).',
    },
  },
};
