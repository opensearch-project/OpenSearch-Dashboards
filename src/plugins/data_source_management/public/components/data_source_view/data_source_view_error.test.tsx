/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { DataSourceViewError } from './data_source_view_error';
import { render } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { DSM_APP_ID } from '../../plugin';

describe('DataSourceViewError component', () => {
  const mockHandleSwitchDefaultDatasource = jest.fn();

  const props = {
    dataSourceId: 'testDataSourceId',
    showSwitchButton: true,
    handleSwitchDefaultDatasource: mockHandleSwitchDefaultDatasource,
  };

  it('should render without crashing', () => {
    const wrapper = shallow(<DataSourceViewError {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('should call handleSwitchDefaultDatasource when switch button is clicked', async () => {
    const container = render(<DataSourceViewError {...props} />);
    const button = await container.findByTestId('dataSourceViewErrorPopover');
    button.click();
    expect(container).toMatchSnapshot();
  });
});
