/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { IFieldType } from '../../..';
import { RangeValueInput } from './range_value_input';

describe('Range value input', () => {
  it('offers date pickers for both range endpoints', () => {
    const onChange = jest.fn();
    const field = { type: 'date' } as IFieldType;
    const value = { from: 'now-1d', to: 'now' };
    const component = mountWithIntl(
      <OpenSearchDashboardsContextProvider services={{ uiSettings: { get: () => 'UTC' } } as any}>
        <RangeValueInput field={field} value={value} onChange={onChange} />
      </OpenSearchDashboardsContextProvider>
    );
    const selectedDate = moment('2026-09-16T10:15:30.000Z');
    const datePickers = component.find('EuiDatePicker');

    expect(component.find('EuiDatePickerRange').exists()).toBeTruthy();
    expect(datePickers).toHaveLength(2);
    expect(datePickers.at(0).prop('value')).toBe(value.from);
    expect(datePickers.at(1).prop('value')).toBe(value.to);

    datePickers.at(0).prop('onChange')?.(selectedDate);
    expect(onChange).toHaveBeenCalledWith({
      from: selectedDate.valueOf(),
      to: value.to,
    });

    datePickers.at(1).prop('onChange')?.(selectedDate);
    expect(onChange).toHaveBeenCalledWith({
      from: value.from,
      to: selectedDate.valueOf(),
    });
  });

  it('preserves picker-generated epoch milliseconds on blur', () => {
    const onChange = jest.fn();
    const selectedDate = moment('2026-09-16T10:15:30.000Z');
    const value = { from: selectedDate.valueOf(), to: 'now' };
    const component = mountWithIntl(
      <OpenSearchDashboardsContextProvider services={{ uiSettings: { get: () => 'UTC' } } as any}>
        <RangeValueInput field={{ type: 'date' } as IFieldType} value={value} onChange={onChange} />
      </OpenSearchDashboardsContextProvider>
    );

    component.find('EuiDatePicker').at(0).prop('onBlur')?.({
      target: { value: 'Sep 16, 2026 @ 10:15:30.000' },
    } as any);

    expect(onChange).toHaveBeenCalledWith(value);
  });
});
