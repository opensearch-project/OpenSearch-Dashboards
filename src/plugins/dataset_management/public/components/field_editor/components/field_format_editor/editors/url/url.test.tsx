/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';
import { FieldFormat } from 'src/plugins/data/public';

import { UrlFormatEditor } from './url';

const fieldType = 'string';
const format = {
  getConverterFor: jest
    .fn()
    .mockImplementation(() => (input: string) => `converted url for ${input}`),
  type: {
    urlTypes: [
      { kind: 'a', text: 'Link' },
      { kind: 'img', text: 'Image' },
      { kind: 'audio', text: 'Audio' },
    ],
  },
};
const formatParams = {
  openLinkInCurrentTab: true,
  urlTemplate: '',
  labelTemplate: '',
  width: '',
  height: '',
};
const onChange = jest.fn();
const onError = jest.fn();

describe('UrlFormatEditor', () => {
  it('should have a formatId', () => {
    expect(UrlFormatEditor.formatId).toEqual('url');
  });

  it('should render normally', async () => {
    const component = shallow(
      <UrlFormatEditor
        fieldType={fieldType}
        format={(format as unknown) as FieldFormat}
        formatParams={formatParams}
        onChange={onChange}
        onError={onError}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render url template help', async () => {
    const component = shallow(
      <UrlFormatEditor
        fieldType={fieldType}
        format={(format as unknown) as FieldFormat}
        formatParams={formatParams}
        onChange={onChange}
        onError={onError}
      />
    );

    (component.instance() as UrlFormatEditor).showUrlTemplateHelp();
    component.update();
    expect(component).toMatchSnapshot();
  });

  it('should render label template help', async () => {
    const component = shallow(
      <UrlFormatEditor
        fieldType={fieldType}
        format={(format as unknown) as FieldFormat}
        formatParams={formatParams}
        onChange={onChange}
        onError={onError}
      />
    );

    (component.instance() as UrlFormatEditor).showLabelTemplateHelp();
    component.update();
    expect(component).toMatchSnapshot();
  });

  it('should render width and height fields if image', async () => {
    const component = shallow(
      <UrlFormatEditor
        fieldType={fieldType}
        format={(format as unknown) as FieldFormat}
        formatParams={{ ...formatParams, type: 'img' }}
        onChange={onChange}
        onError={onError}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
