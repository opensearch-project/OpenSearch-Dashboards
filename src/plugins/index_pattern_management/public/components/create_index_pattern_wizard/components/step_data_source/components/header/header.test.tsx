/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header } from '../header';
import { shallowWithIntl } from 'test_utils/enzyme_helpers';

jest.mock('../../../../../../../../../plugins/opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: {
      notifications: { toast: { addWarning: jest.fn() } },
    },
  }),
}));

afterAll(() => jest.clearAllMocks());

describe('Header', () => {
  it('should render existing data sources list when choose to use data source', () => {
    const component = shallowWithIntl(
      <Header
        onDataSourceSelected={() => {}}
        dataSourceRef={{ type: 'type', id: 'id', title: 'title' }!}
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
        .find('[data-test-subj="createIndexPatternStepDataSourceSelectDataSource"]')
        .first()
        .exists()
    ).toBeTruthy();
  });

  it('should disable next step before select data source', () => {
    const component = shallowWithIntl(
      <Header
        onDataSourceSelected={() => {}}
        dataSourceRef={{ type: 'type', id: 'id', title: 'title' }!}
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
    const component = shallowWithIntl(
      <Header
        onDataSourceSelected={() => {}}
        dataSourceRef={{ type: 'type', id: 'id', title: 'title' }!}
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
