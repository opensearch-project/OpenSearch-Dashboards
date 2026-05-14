/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  fetchDataSourceMetaData,
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
import { act } from 'react';
import * as utils from '../utils';

const formIdentifier = 'CreateDataSourceForm';
describe('Datasource Management: Create Datasource Wizard', () => {
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const history = (scopedHistoryMock.create() as unknown) as ScopedHistory;
  describe('case1: should load resources successfully', () => {
    beforeEach(async () => {
      jest.spyOn(utils, 'getDataSources').mockReturnValue(Promise.resolve(getMappedDataSources));
      jest
        .spyOn(utils, 'fetchDataSourceMetaData')
        .mockReturnValue(Promise.resolve(fetchDataSourceMetaData));
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
            // @ts-expect-error TS2769 TODO(ts-error): fixme
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
      jest.spyOn(utils, 'createSingleDataSource').mockReturnValue({});
      jest.spyOn(utils, 'handleSetDefaultDatasource').mockReturnValue({});
      await act(async () => {
        // @ts-ignore
        await component.find(formIdentifier).first().prop('handleSubmit')(
          mockDataSourceAttributesWithAuth
        );
      });
      expect(utils.createSingleDataSource).toHaveBeenCalled();
      expect(history.push).toBeCalledWith('');
      expect(utils.handleSetDefaultDatasource).toHaveBeenCalled();
    });

    test('should fail to create datasource', async () => {
      jest.spyOn(utils, 'createSingleDataSource').mockImplementation(() => {
        throw new Error('error');
      });
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
      jest.spyOn(utils, 'testConnection').mockReturnValue({});

      await act(async () => {
        // @ts-ignore
        await component.find('CreateDataSourceForm').first().prop('handleTestConnection')(
          mockDataSourceAttributesWithAuth
        );
      });
      expect(utils.testConnection).toHaveBeenCalled();
    });

    test('should fail to test connection to the endpoint', async () => {
      jest.spyOn(utils, 'testConnection').mockImplementation(() => {
        throw new Error('error');
      });
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

      expect(history.push).toBeCalledWith('/create');
    });
  });

  describe('case2: should fail to load resources', () => {
    beforeEach(async () => {
      jest.spyOn(utils, 'getDataSources').mockImplementation(() => {
        throw new Error('');
      });
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
            // @ts-expect-error TS2769 TODO(ts-error): fixme
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
