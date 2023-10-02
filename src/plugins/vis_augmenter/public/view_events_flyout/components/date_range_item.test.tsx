/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { findTestSubject } from 'test_utils/helpers';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { DateRangeItem } from './date_range_item';
import { TimeRange } from '../../../../data/common';
import { prettyDuration } from '@elastic/eui';
import { DATE_RANGE_FORMAT } from './view_events_flyout';

describe('<DateRangeItem/>', () => {
  const mockTimeRange = {
    from: 'now-7d',
    to: 'now',
  } as TimeRange;
  const mockReloadFn = jest.fn();

  it('time range is displayed correctly', async () => {
    const prettyTimeRange = prettyDuration(
      mockTimeRange.from,
      mockTimeRange.to,
      [],
      DATE_RANGE_FORMAT
    );

    const { getByText } = render(<DateRangeItem timeRange={mockTimeRange} reload={mockReloadFn} />);
    expect(getByText(prettyTimeRange)).toBeInTheDocument();
  });

  it('triggers reload on clicking on refresh button', async () => {
    const component = mountWithIntl(
      <DateRangeItem timeRange={mockTimeRange} reload={mockReloadFn} />
    );
    const refreshButton = findTestSubject(component, 'refreshButton');
    refreshButton.simulate('click');
    expect(mockReloadFn).toHaveBeenCalledTimes(1);
  });

  // Note we are not creating/comparing snapshots for this component. That is because
  // it will hardcode a time-specific value which can cause failures when running
  // in different envs
  it('renders component', async () => {
    const { getByTestId } = render(
      <DateRangeItem timeRange={mockTimeRange} reload={mockReloadFn} />
    );
    expect(getByTestId('durationText')).toBeInTheDocument();
    expect(getByTestId('refreshButton')).toBeInTheDocument();
    expect(getByTestId('refreshDescriptionText')).toBeInTheDocument();
  });
});
