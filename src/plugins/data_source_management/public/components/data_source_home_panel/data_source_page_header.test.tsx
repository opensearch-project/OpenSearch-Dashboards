/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { DataSourceHeader } from './data_source_page_header';
import { EuiTitle, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

describe('DataSourceHeader', () => {
  const defaultProps = {
    history: {} as any,
    location: {} as any,
    match: {} as any,
  };

  const shallowComponent = (props = defaultProps) => shallow(<DataSourceHeader {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('contains correct title and description', () => {
    const wrapper = shallowComponent();

    const titleMessage = wrapper.find(EuiTitle).find(FormattedMessage);
    expect(titleMessage.prop('id')).toEqual('dataSourcesManagement.dataSourcesTable.title');
    expect(titleMessage.prop('defaultMessage')).toEqual('Data Sources');

    const descriptionMessage = wrapper.find(EuiText).find(FormattedMessage);
    expect(descriptionMessage.prop('id')).toEqual(
      'dataSourcesManagement.dataSourcesTable.description'
    );
    expect(descriptionMessage.prop('defaultMessage')).toEqual(
      'Create and manage data source connections.'
    );
  });
});
