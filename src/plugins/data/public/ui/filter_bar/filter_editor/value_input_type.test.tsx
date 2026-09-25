/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mountWithIntl } from 'test_utils/enzyme_helpers';
import moment from 'moment';
import { act } from 'react';
import { ValueInputType } from './value_input_type';

let onChangeMock: any;

describe('Value input type', () => {
  beforeAll(() => {
    onChangeMock = jest.fn();
  });
  it('is number', async () => {
    const valueInputProps = {
      value: 1,
      type: 'number',
      onChange: onChangeMock,
      onBlur: () => {},
      placeholder: '',
    };
    const component = mountWithIntl(<ValueInputType {...valueInputProps} />);
    expect(component.find('EuiFieldNumber').exists()).toBeTruthy();
    expect(component.find('EuiFieldNumber').prop('value')).toBe(1);
  });

  it('is string', async () => {
    const valueInputProps = {
      value: 'value',
      type: 'string',
      onChange: () => {},
      onBlur: () => {},
      placeholder: '',
    };
    const component = mountWithIntl(<ValueInputType {...valueInputProps} />);
    expect(component.find('EuiFieldText').exists()).toBeTruthy();
    expect(component.find('EuiFieldText').prop('value')).toBe('value');
  });

  it('is boolean', async () => {
    const valueInputProps = {
      value: 'true',
      type: 'boolean',
      onChange: () => {},
      onBlur: () => {},
      placeholder: '',
    };
    const component = mountWithIntl(<ValueInputType {...valueInputProps} />);
    expect(component.find('EuiSelect').exists()).toBeTruthy();
    expect(component.find('EuiSelect').prop('value')).toBe('true');
  });

  it('offers a date picker while preserving manual date input', async () => {
    const onChange = jest.fn();
    const valueInputProps = {
      value: 'now-15m',
      type: 'date',
      onChange,
      onBlur: () => {},
      placeholder: '',
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
    };
    const component = mountWithIntl(<ValueInputType {...valueInputProps} />);
    const datePicker = component.find('EuiDatePicker');

    expect(datePicker.exists()).toBeTruthy();
    expect(datePicker.prop('value')).toBe('now-15m');
    expect(datePicker.prop('dateFormat')).toBe(valueInputProps.dateFormat);

    component.find('input').simulate('change', { target: { value: 'now/d' } });
    expect(onChange).toHaveBeenCalledWith('now/d');
  });

  it('returns picker-selected dates as ISO strings', async () => {
    const onChange = jest.fn();
    const component = mountWithIntl(
      <ValueInputType value="" type="date" onChange={onChange} placeholder="" />
    );
    const selectedDate = moment('2026-09-16T10:15:30.000Z');
    const datePicker = component.find('EuiDatePicker');

    datePicker.prop('onChange')?.(selectedDate);

    expect(onChange).toHaveBeenCalledWith('2026-09-16T10:15:30.000Z');
  });

  it('displays absolute dates using the configured date format', async () => {
    const dateFormat = 'YYYY-MM-DD HH:mm:ss';
    const selectedDate = moment('2026-09-16 10:15:30');
    const component = mountWithIntl(
      <ValueInputType
        value={selectedDate.toISOString()}
        type="date"
        dateFormat={dateFormat}
        onChange={jest.fn()}
        placeholder=""
      />
    );

    expect(component.find('input').prop('value')).toBe(selectedDate.format(dateFormat));
  });

  it('handles date picker blur without a DOM event', async () => {
    const onBlur = jest.fn();
    const component = mountWithIntl(
      <ValueInputType type="date" onChange={jest.fn()} onBlur={onBlur} placeholder="" />
    );
    const datePicker = component.find('EuiDatePicker');

    expect(() => (datePicker.prop('onBlur') as () => void)()).not.toThrow();
    expect(onBlur).not.toHaveBeenCalled();
  });

  it('preserves the canonical absolute date when the formatted picker input blurs', async () => {
    const onBlur = jest.fn();
    const value = '2026-09-16T10:15:30.000Z';
    const component = mountWithIntl(
      <ValueInputType
        value={value}
        type="date"
        dateFormat="YYYY-MM-DD HH:mm:ss"
        onChange={jest.fn()}
        onBlur={onBlur}
        placeholder=""
      />
    );

    component.find('EuiDatePicker').prop('onBlur')?.({
      target: { value: '2026-09-16 10:15:30' },
    } as React.FocusEvent<HTMLInputElement>);

    expect(onBlur).toHaveBeenCalledWith(value);
  });

  it('uses the current manually edited value when a date input blurs', async () => {
    const onBlur = jest.fn();
    const component = mountWithIntl(
      <ValueInputType
        value="previous value"
        type="date"
        onChange={jest.fn()}
        onBlur={onBlur}
        placeholder=""
      />
    );

    act(() => {
      component.find('EuiDatePicker').prop('onChangeRaw')?.({
        preventDefault: jest.fn(),
        target: { value: 'current value' },
      } as any);
    });
    component.update();
    act(() => {
      component.find('EuiDatePicker').prop('onBlur')?.({
        target: { value: 'current value' },
      } as React.FocusEvent<HTMLInputElement>);
    });

    expect(onBlur).toHaveBeenCalledWith('current value');
  });

  it('is ip', async () => {
    const valueInputProps = {
      value: '127.0.0.1',
      type: 'ip',
      onChange: () => {},
      onBlur: () => {},
      placeholder: '',
    };
    const component = mountWithIntl(<ValueInputType {...valueInputProps} />);
    expect(component.find('EuiFieldText').exists()).toBeTruthy();
    expect(component.find('EuiFieldText').prop('value')).toBe('127.0.0.1');
  });
});
