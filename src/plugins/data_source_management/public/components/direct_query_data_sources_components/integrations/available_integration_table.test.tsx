/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { waitFor } from '@testing-library/react';
import { AvailableIntegrationsTable } from './available_integration_table';
import { availableTableViewData } from '../../../mocks';
import React from 'react';

describe('Available Integration Table View Test', () => {
  configure({ adapter: new Adapter() });

  it('Renders nginx integration table view using dummy data', async () => {
    const wrapper = mount(<AvailableIntegrationsTable {...availableTableViewData} />);

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });
});
