/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
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
    expect(component).toMatchSnapshot();
  });

  it('is number bigint', async () => {
    const valueInputProps = {
      value: '1n',
      type: 'number',
      onChange: onChangeMock,
      onBlur: () => {},
      placeholder: '',
    };
    const component = mountWithIntl(<ValueInputType {...valueInputProps} />);
    expect(component).toMatchSnapshot();
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
    expect(component).toMatchSnapshot();
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
    expect(component).toMatchSnapshot();
  });

  it('is date', async () => {
    const valueInputProps = {
      value: 'Jun 18, 2024 @ 12:01:55.000',
      type: 'date',
      onChange: () => {},
      onBlur: () => {},
      placeholder: '',
    };
    const component = mountWithIntl(<ValueInputType {...valueInputProps} />);
    expect(component).toMatchSnapshot();
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
    expect(component).toMatchSnapshot();
  });
});
