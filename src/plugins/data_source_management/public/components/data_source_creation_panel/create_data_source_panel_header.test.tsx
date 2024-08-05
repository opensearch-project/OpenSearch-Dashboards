/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { CreateDataSourcePanelHeader } from './create_data_source_panel_header';
import { EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

describe('CreateDataSourcePanelHeader', () => {
  const shallowComponent = () => shallow(<CreateDataSourcePanelHeader />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('contains correct title and description', () => {
    const wrapper = shallowComponent();

    const titleMessage = wrapper.find(EuiText).at(0).find(FormattedMessage);
    expect(titleMessage.prop('id')).toEqual('dataSourcesManagement.createDataSourcePanel.title');
    expect(titleMessage.prop('defaultMessage')).toEqual('Create Data Source');

    const descriptionMessage = wrapper.find(EuiText).at(1).find(FormattedMessage);
    expect(descriptionMessage.prop('id')).toEqual(
      'dataSourcesManagement.createDataSourcePanel.description'
    );
    expect(descriptionMessage.prop('defaultMessage')).toEqual(
      'Select a data source type to get started.'
    );
  });
});
