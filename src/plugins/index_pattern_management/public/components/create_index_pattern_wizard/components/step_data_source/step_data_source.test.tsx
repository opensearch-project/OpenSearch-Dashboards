/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { StepDataSource } from './step_data_source';

describe('StepDataSource', () => {
  it('should render normally', () => {
    const component = shallow(
      <StepDataSource
        goToNextStep={() => {}}
        stepInfo={{ totalStepNumber: 0, currentStepNumber: 0 }}
      />
    );

    expect(component).toMatchSnapshot();
  });
});
