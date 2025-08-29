/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';
import { FieldFormat } from 'src/plugins/data/public';

import { ColorFormatEditor } from './color';
import { fieldFormats } from '../../../../../../../../data/public';

const fieldType = 'string';
const format = {
  getConverterFor: jest.fn(),
};
const formatParams = {
  colors: [{ ...fieldFormats.DEFAULT_CONVERTER_COLOR }],
};
const onChange = jest.fn();
const onError = jest.fn();

describe('ColorFormatEditor', () => {
  it('should have a formatId', () => {
    expect(ColorFormatEditor.formatId).toEqual('color');
  });

  it('should render string type normally (regex field)', async () => {
    const component = shallowWithI18nProvider(
      <ColorFormatEditor
        fieldType={fieldType}
        format={(format as unknown) as FieldFormat}
        formatParams={formatParams}
        onChange={onChange}
        onError={onError}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render other type normally (range field)', async () => {
    const component = shallowWithI18nProvider(
      <ColorFormatEditor
        fieldType={'number'}
        format={(format as unknown) as FieldFormat}
        formatParams={formatParams}
        onChange={onChange}
        onError={onError}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render multiple colors', async () => {
    const component = shallowWithI18nProvider(
      <ColorFormatEditor
        fieldType={fieldType}
        format={(format as unknown) as FieldFormat}
        formatParams={{ colors: [...formatParams.colors, ...formatParams.colors] }}
        onChange={onChange}
        onError={onError}
      />
    );

    expect(component).toMatchSnapshot();
  });
});
