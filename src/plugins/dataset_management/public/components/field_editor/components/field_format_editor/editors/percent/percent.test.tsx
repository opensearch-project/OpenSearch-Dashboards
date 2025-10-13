/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';
import { FieldFormat } from '../../../../../../../../data/public';

import { PercentFormatEditor } from './percent';

const fieldType = 'number';
const format = {
  getConverterFor: jest.fn().mockImplementation(() => (input: number) => input * 2),
  getParamDefaults: jest.fn().mockImplementation(() => {
    return { pattern: '0,0.[000]%' };
  }),
};
const formatParams = {
  pattern: '',
};
const onChange = jest.fn();
const onError = jest.fn();

describe('PercentFormatEditor', () => {
  it('should have a formatId', () => {
    expect(PercentFormatEditor.formatId).toEqual('percent');
  });

  it('should render normally', async () => {
    const component = shallow(
      <PercentFormatEditor
        fieldType={fieldType}
        format={(format as unknown) as FieldFormat}
        formatParams={formatParams}
        onChange={onChange}
        onError={onError}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
