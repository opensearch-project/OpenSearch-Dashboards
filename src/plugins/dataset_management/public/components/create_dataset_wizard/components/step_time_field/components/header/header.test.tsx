/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header } from '../header';
import { shallow } from 'enzyme';

describe('Header', () => {
  it('should render normally', () => {
    const component = shallow(
      <Header
        dataset="ki*"
        datasetName="ki*"
        stepInfo={{ totalStepNumber: 0, currentStepNumber: 0 }}
      />
    );

    expect(component).toMatchSnapshot();
  });
});
