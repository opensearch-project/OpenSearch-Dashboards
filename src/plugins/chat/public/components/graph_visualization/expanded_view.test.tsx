/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render } from '@testing-library/react';
import { ExpandedView } from './expanded_view';
import { ChartData } from './types';

jest.mock('@elastic/charts', () => ({
  Chart: () => null,
  LineSeries: () => null,
  Axis: () => null,
  Settings: () => null,
  Position: { Bottom: 'bottom', Left: 'left' },
  ScaleType: { Time: 'time', Linear: 'linear' },
}));

jest.mock('./theme_utils', () => ({
  useChartsTheme: () => ({}),
  useChartsBaseTheme: () => ({}),
  getGraphVisualizationTheme: () => ({}),
}));

jest.mock('./chart_config', () => ({
  createTooltipSettings: () => ({}),
}));

describe('ExpandedView', () => {
  it('closes on Escape', () => {
    const onClose = jest.fn();
    const chartData = { title: 'Chart', series: [] } as unknown as ChartData;

    render(<ExpandedView isOpen={true} onClose={onClose} chartData={chartData} />);

    fireEvent.keyDown(document, { key: 'Escape', keyCode: 27 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
