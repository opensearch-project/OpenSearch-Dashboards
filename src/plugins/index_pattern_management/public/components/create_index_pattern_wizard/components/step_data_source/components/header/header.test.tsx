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
        onDataSourceSelected={() => {}}
        dataSourceRef={{ type: 'type', id: 'id' }!}
        goToNextStep={() => {}}
        isNextStepDisabled={true}
        stepInfo={{ totalStepNumber: 0, currentStepNumber: 0 }}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render data source finder when choose to use data source', () => {
    const component = shallow(
      <Header
        onDataSourceSelected={() => {}}
        dataSourceRef={{ type: 'type', id: 'id' }!}
        goToNextStep={() => {}}
        isNextStepDisabled={true}
        stepInfo={{ totalStepNumber: 0, currentStepNumber: 0 }}
      />
    );

    component
      .find('[data-test-subj="createIndexPatternStepDataSourceUseDataSourceRadio"]')
      .simulate('change', {
        target: {
          checked: true,
        },
      });

    expect(component).toMatchSnapshot();
  });

  it('should disable next step before select data source', () => {
    const component = shallow(
      <Header
        onDataSourceSelected={() => {}}
        dataSourceRef={{ type: 'type', id: 'id' }!}
        goToNextStep={() => {}}
        isNextStepDisabled={true}
        stepInfo={{ totalStepNumber: 0, currentStepNumber: 0 }}
      />
    );

    component
      .find('[data-test-subj="createIndexPatternStepDataSourceUseDataSourceRadio"]')
      .simulate('change', {
        target: {
          checked: true,
        },
      });

    expect(
      component
        .find('[data-test-subj="createIndexPatternStepDataSourceNextStepButton"]')
        .prop('isDisabled')
    ).toEqual(true);
  });

  it('should enable next step when pick default option', () => {
    const component = shallow(
      <Header
        onDataSourceSelected={() => {}}
        dataSourceRef={{ type: 'type', id: 'id' }!}
        goToNextStep={() => {}}
        isNextStepDisabled={true}
        stepInfo={{ totalStepNumber: 0, currentStepNumber: 0 }}
      />
    );

    component
      .find('[data-test-subj="createIndexPatternStepDataSourceUseDefaultRadio"]')
      .simulate('change', {
        target: {
          checked: true,
        },
      });

    expect(
      component
        .find('[data-test-subj="createIndexPatternStepDataSourceNextStepButton"]')
        .prop('isDisabled')
    ).toEqual(false);
  });
});
