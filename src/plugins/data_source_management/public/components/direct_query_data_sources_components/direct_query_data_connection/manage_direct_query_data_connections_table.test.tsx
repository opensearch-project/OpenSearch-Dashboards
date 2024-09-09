/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import * as utils from '../../utils';
import { mount, ReactWrapper } from 'enzyme';
import { RouteComponentProps } from 'react-router-dom';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { ScopedHistory } from 'opensearch-dashboards/public';
import { scopedHistoryMock } from '../../../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { getMappedDataSources, mockManagementPlugin } from '../../../mocks';
import { ManageDirectQueryDataConnectionsTable } from './manage_direct_query_data_connections_table';

const deleteButtonIdentifier = '[data-test-subj="deleteDataSourceConnections"]';
const tableIdentifier = 'EuiInMemoryTable';
const confirmModalIdentifier = 'EuiConfirmModal';

describe('ManageDirectQueryDataConnectionsTable', () => {
  const mockedContext = {
    ...mockManagementPlugin.createDataSourceManagementContext(),
    application: { capabilities: { dataSource: { canManage: true } } },
  };
  const uiSettings = mockedContext.uiSettings;
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const history = (scopedHistoryMock.create() as unknown) as ScopedHistory;
  describe('should get direct query connections failed', () => {
    beforeEach(async () => {
      spyOn(utils, 'getDataSources').and.returnValue(Promise.reject());
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <ManageDirectQueryDataConnectionsTable
              featureFlagStatus={true}
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
    test('should render empty table', () => {
      expect(component).toMatchSnapshot();
    });
  });

  describe('should get direct query connections successful', () => {
    beforeEach(async () => {
      spyOn(utils, 'getDataSources').and.returnValue(Promise.resolve(getMappedDataSources));
      spyOn(utils, 'fetchDataSourceConnections').and.returnValue(
        Promise.resolve(getMappedDataSources)
      );
      spyOn(utils, 'getHideLocalCluster').and.returnValue(false);
      spyOn(uiSettings, 'get').and.returnValue('test1');
      await act(async () => {
        component = await mount(
          wrapWithIntl(
            <ManageDirectQueryDataConnectionsTable
              featureFlagStatus={true}
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

    it('should render normally', () => {
      expect(component).toMatchSnapshot();
      expect(utils.getDataSources).toHaveBeenCalled();
    });

    it('should show delete button when select datasources', () => {
      expect(component.find(deleteButtonIdentifier).exists()).toBe(false);

      act(() => {
        // @ts-ignore
        component.find(tableIdentifier).props().selection.onSelectionChange(getMappedDataSources);
      });
      component.update();
      expect(component.find(deleteButtonIdentifier).exists()).toBe(true);
    });

    it('should delete confirm modal pop up and cancel button work normally', () => {
      act(() => {
        // @ts-ignore
        component.find(tableIdentifier).props().selection.onSelectionChange(getMappedDataSources);
      });
      component.update();
      component.find(deleteButtonIdentifier).first().simulate('click');
      // test if modal pop up when click the delete button
      expect(component.find(confirmModalIdentifier).exists()).toBe(true);

      act(() => {
        // @ts-ignore
        component.find(confirmModalIdentifier).first().props().onCancel();
      });
      component.update();
      expect(component.find(confirmModalIdentifier).exists()).toBe(false);
    });

    it('should delete confirm modal confirm button work normally', async () => {
      spyOn(utils, 'deleteMultipleDataSources').and.returnValue(Promise.resolve({}));
      spyOn(utils, 'setFirstDataSourceAsDefault').and.returnValue({});
      act(() => {
        // @ts-ignore
        component.find(tableIdentifier).props().selection.onSelectionChange(getMappedDataSources);
      });
      component.update();
      component.find(deleteButtonIdentifier).first().simulate('click');
      expect(component.find(confirmModalIdentifier).exists()).toBe(true);

      await act(async () => {
        // @ts-ignore
        await component.find(confirmModalIdentifier).first().props().onConfirm();
      });
      component.update();
      expect(component.find(confirmModalIdentifier).exists()).toBe(false);
      expect(utils.setFirstDataSourceAsDefault).toHaveBeenCalled();
    });

    it('should delete datasources & fail', async () => {
      spyOn(utils, 'deleteMultipleDataSources').and.returnValue(Promise.reject({}));
      spyOn(utils, 'setFirstDataSourceAsDefault').and.returnValue({});
      act(() => {
        // @ts-ignore
        component.find(tableIdentifier).props().selection.onSelectionChange(getMappedDataSources);
      });

      component.update();
      component.find(deleteButtonIdentifier).first().simulate('click');
      expect(component.find(confirmModalIdentifier).exists()).toBe(true);

      await act(async () => {
        // @ts-ignore
        await component.find(confirmModalIdentifier).props().onConfirm();
      });
      component.update();
      expect(utils.deleteMultipleDataSources).toHaveBeenCalled();
      expect(utils.setFirstDataSourceAsDefault).not.toHaveBeenCalled();
      // @ts-ignore
      expect(component.find(confirmModalIdentifier).exists()).toBe(false);
    });
  });
});
