/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  getMappedDataSources,
  mockDataSourceAttributesWithAuth,
  mockManagementPlugin,
} from '../../mocks';
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
describe('Datasource Management: Create Datasource Wizard', () => {
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const history = (scopedHistoryMock.create() as unknown) as ScopedHistory;
  describe('case1: should load resources successfully', () => {
    beforeEach(async () => {
      spyOn(utils, 'getDataSources').and.returnValue(Promise.resolve(getMappedDataSources));
      await act(async () => {
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
      component.update();
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
    });

    test('should test connection to the endpoint successfully', async () => {
      spyOn(utils, 'testConnection').and.returnValue({});

      await act(async () => {
        // @ts-ignore
        await component.find('CreateDataSourceForm').first().prop('handleTestConnection')(
          mockDataSourceAttributesWithAuth
        );
      });
      expect(utils.testConnection).toHaveBeenCalled();
    });

    test('should fail to test connection to the endpoint', async () => {
      spyOn(utils, 'testConnection').and.throwError('error');
      await act(async () => {
        // @ts-ignore
        await component.find('CreateDataSourceForm').first().prop('handleTestConnection')(
          mockDataSourceAttributesWithAuth
        );
      });
      component.update();
      expect(utils.testConnection).toHaveBeenCalled();
    });

    test('should go back to listing page if clicked on cancel button', async () => {
      await act(async () => {
        // @ts-ignore
        await component.find(formIdentifier).first().prop('handleCancel')();
      });

      expect(history.push).toBeCalledWith('');
    });
  });

  describe('case2: should fail to load resources', () => {
    beforeEach(async () => {
      spyOn(utils, 'getDataSources').and.throwError('');
      await act(async () => {
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
      component.update();
    });

    test('should not render component and go back to listing page', () => {
      expect(history.push).toBeCalledWith('');
    });
  });
});
