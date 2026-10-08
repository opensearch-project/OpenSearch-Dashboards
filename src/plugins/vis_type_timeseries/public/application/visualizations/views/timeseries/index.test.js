/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shallow } from 'enzyme';
import { Settings, Tooltip, TooltipType } from '@elastic/charts';
import { getChartsSetup, getUISettings } from '../../../../services';
import { TimeSeries } from './index';

jest.unmock('@elastic/charts');

jest.mock('../../../lib/get_timezone', () => ({
  getTimezone: jest.fn(() => 'UTC'),
}));

jest.mock('../../../../services', () => ({
  getChartsSetup: jest.fn(),
  getUISettings: jest.fn(),
}));

describe('TSVB TimeSeries', () => {
  const timestamp = 1782856800000;
  const xAxisFormatter = jest.fn((value) => `formatted-${value}`);

  beforeEach(() => {
    getUISettings.mockReturnValue({});
    getChartsSetup.mockReturnValue({
      colors: {
        mappedColors: {
          mapKeys: jest.fn(),
          mapping: {},
        },
      },
      theme: {
        useChartsBaseTheme: jest.fn(() => ({})),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers the date formatter with the tooltip spec', () => {
    const wrapper = shallow(
      <TimeSeries
        series={[]}
        yAxis={[]}
        annotations={[]}
        onBrush={jest.fn()}
        tooltipMode="show_all"
        xAxisFormatter={xAxisFormatter}
      />
    );

    const tooltip = wrapper.find(Tooltip);

    expect(tooltip).toHaveLength(1);
    expect(tooltip.props()).toMatchObject({
      snap: true,
      type: TooltipType.VerticalCursor,
    });
    expect(tooltip.prop('headerFormatter')({ value: timestamp })).toBe(`formatted-${timestamp}`);
    expect(wrapper.find(Settings).prop('tooltip')).toBeUndefined();
  });
});
