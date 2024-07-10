/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { DataSourceErrorMenu } from './data_source_error_menu';
import { coreMock } from '../../../../../core/public/mocks';
import { render } from '@testing-library/react';

describe('DataSourceErrorMenu', () => {
  const applicationMock = coreMock.createStart().application;
  it('renders without crashing', () => {
    const component = shallow(<DataSourceErrorMenu application={applicationMock} />);
    expect(component).toMatchSnapshot();
  });

  it('should toggle popover when icon button is clicked', () => {
    const container = render(<DataSourceErrorMenu application={applicationMock} />);
    const iconButton = container.getByTestId('dataSourceErrorMenuHeaderLink');
    iconButton.click();
    expect(container.getByTestId('dataSourceErrorPopover')).toBeVisible();
    expect(container.getByTestId('datasourceTableEmptyState')).toHaveTextContent(
      'Failed to fetch data sources'
    );
  });
});
