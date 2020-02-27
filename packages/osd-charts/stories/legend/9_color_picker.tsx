import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';

import { EuiColorPicker, EuiWrappingPopover, EuiButton, EuiSpacer } from '@elastic/eui';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings, LegendColorPicker } from '../../src/';
import { BARCHART_1Y1G } from '../../src/utils/data_samples/test_dataset';
import { SeriesKey } from '../../src/chart_types/xy_chart/utils/series';
import { Color } from '../../src/utils/commons';

const onChangeAction = action('onChange');
const onCloseAction = action('onClose');

export const example = () => {
  const [colors, setColors] = useState<Record<SeriesKey, Color>>({});

  const renderColorPicker: LegendColorPicker = ({ anchor, color, onClose, seriesIdentifier, onChange }) => {
    const handleClose = () => {
      onClose();
      onCloseAction();
      setColors({
        ...colors,
        [seriesIdentifier.key]: color,
      });
    };
    const handleChange = (color: Color) => {
      onChange(color);
      onChangeAction(color);
    };
    return (
      <EuiWrappingPopover isOpen button={anchor} closePopover={handleClose}>
        <EuiColorPicker display="inline" color={color} onChange={handleChange}></EuiColorPicker>
        <EuiSpacer size="m" />
        <EuiButton fullWidth size="s" onClick={handleClose}>
          Done
        </EuiButton>
      </EuiWrappingPopover>
    );
  };

  return (
    <Chart className="story-chart">
      <Settings showLegend legendColorPicker={renderColorPicker} />
      <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks={true} />
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

example.story = {
  parameters: {
    info: {
      text:
        'Elastic charts will maintain the color selection in memory beyond chart updates. However, to persist colors beyond browser refresh the consumer would need to manage the color state and use the color prop on the SeriesSpec to assign a color via a SeriesColorAccessor.',
    },
  },
};
