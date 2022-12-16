/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mockDataSourceAttributesWithAuth, mockManagementPlugin } from '../../mocks';
import { mount, ReactWrapper } from 'enzyme';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { CreateDataSourceWizard } from './create_data_source_wizard';
import { scopedHistoryMock } from '../../../../../core/public/mocks';
import { ScopedHistory } from 'opensearch-dashboards/public';
import { RouteComponentProps } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import * as utils from '../utils';

const formIdentifier = 'CreateDataSourceForm';
const toastsIdentifier = 'EuiGlobalToastList';
describe('Datasource Management: Create Datasource Wizard', () => {
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const history = (scopedHistoryMock.create() as unknown) as ScopedHistory;
  beforeEach(() => {
    component = mount(
      wrapWithIntl(
        <CreateDataSourceWizard
          history={history}
          location={({} as unknown) as RouteComponentProps['location']}
          match={({} as unknown) as RouteComponentProps['match']}
        />
      ),
      {
        wrappingComponent: OpenSearchDashboardsContextProvider,
        wrappingComponentProps: {
          services: mockedContext,
        },
      }
    );
  });
  test('should render normally', () => {
    expect(component).toMatchSnapshot();
  });
  test('should create datasource successfully', async () => {
    spyOn(utils, 'createSingleDataSource').and.returnValue({});

    await act(async () => {
      // @ts-ignore
      await component.find(formIdentifier).first().prop('handleSubmit')(
        mockDataSourceAttributesWithAuth
      );
    });
    expect(utils.createSingleDataSource).toHaveBeenCalled();
    expect(history.push).toBeCalledWith('');
  });
  test('should fail to create datasource', async () => {
    spyOn(utils, 'createSingleDataSource').and.throwError('error');
    await act(async () => {
      // @ts-ignore
      await component.find(formIdentifier).first().prop('handleSubmit')(
        mockDataSourceAttributesWithAuth
      );
    });
    component.update();
    expect(utils.createSingleDataSource).toHaveBeenCalled();
    // @ts-ignore
    expect(component.find(toastsIdentifier).props().toasts.length).toBe(1); // failure toast

    // remove toast message after failure of creating datasource

    act(() => {
      // @ts-ignore
      component.find(toastsIdentifier).first().prop('dismissToast')({
        id: 'dataSourcesManagement.createDataSource.createDataSourceFailMsg',
      });
    });
    component.update();
    // @ts-ignore
    expect(component.find(toastsIdentifier).props().toasts.length).toBe(0); // failure toast
  });
});
