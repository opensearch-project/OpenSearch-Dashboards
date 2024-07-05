/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Header, useEffectOnce } from '../header';
import { shallowWithIntl } from 'test_utils/enzyme_helpers';

jest.mock('../../../../../../../../../plugins/opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: {
      notifications: { toast: { addWarning: jest.fn() } },
    },
  }),
}));

const mockGetDataSourcesCompatible = jest.fn(() =>
  Promise.resolve([{ id: 1, attributes: { title: '213', dataSourceVersion: '2.13.0' } }])
);
const mockGetDataSourcesNotCompatible = jest.fn(() =>
  Promise.resolve([{ id: 1, attributes: { title: '010', dataSourceVersion: '0.1.0' } }])
);

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
        hideLocalCluster={false}
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
        hideLocalCluster={false}
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
        hideLocalCluster={false}
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

  it('should disable next step when local cluster option is hidden and no other option selected', () => {
    const component = shallowWithIntl(
      <Header
        onDataSourceSelected={() => {}}
        dataSourceRef={{ type: 'type', id: 'id', title: 'title' }!}
        goToNextStep={() => {}}
        isNextStepDisabled={true}
        stepInfo={{ totalStepNumber: 0, currentStepNumber: 0 }}
        hideLocalCluster={true}
      />
    );

    expect(
      component
        .find('[data-test-subj="createIndexPatternStepDataSourceNextStepButton"]')
        .prop('isDisabled')
    ).toEqual(true);
  });

  it('should display compatible data source', () => {
    const component = shallowWithIntl(
      <Header
        onDataSourceSelected={() => {}}
        dataSourceRef={{ type: 'type', id: 'id', title: 'title' }!}
        goToNextStep={() => {}}
        isNextStepDisabled={true}
        stepInfo={{ totalStepNumber: 0, currentStepNumber: 0 }}
        hideLocalCluster={false}
        getDataSources={mockGetDataSourcesCompatible}
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

  it('should filter out incompatible data sources', () => {
    const component = shallowWithIntl(
      <Header
        onDataSourceSelected={() => {}}
        dataSourceRef={{ type: 'type', id: 'id', title: 'title' }!}
        goToNextStep={() => {}}
        isNextStepDisabled={true}
        stepInfo={{ totalStepNumber: 0, currentStepNumber: 0 }}
        hideLocalCluster={false}
        getDataSources={mockGetDataSourcesNotCompatible}
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
      component.find('[data-test-subj="createIndexPatternStepDataSourceSelectDataSource"]').first()
    ).toEqual({});
  });
});
