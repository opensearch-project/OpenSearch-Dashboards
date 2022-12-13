/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { Header } from './header';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { mockManagementPlugin } from '../../../../mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../../opensearch_dashboards_react/public';
import { act } from 'react-dom/test-utils';

const headerTitleIdentifier = '[data-test-subj="editDataSourceTitle"]';
const deleteIconIdentifier = '[data-test-subj="editDatasourceDeleteIcon"]';
const confirmModalIdentifier = '[data-test-subj="editDatasourceDeleteConfirmModal"]';

describe('Datasource Management: Edit Datasource Header', () => {
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const mockFn = jest.fn();
  const dataSourceName = 'testTest20';

  describe('show delete icon', () => {
    beforeEach(() => {
      component = mount(
        wrapWithIntl(
          <Header
            isFormValid={true}
            showDeleteIcon={true}
            onClickDeleteIcon={mockFn}
            onClickTestConnection={mockFn}
            dataSourceName={dataSourceName}
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
      expect(component.find(headerTitleIdentifier).last().text()).toBe(dataSourceName);
    });
    test('should show confirm delete modal pop up on trash icon click and cancel button work normally', () => {
      component.find(deleteIconIdentifier).first().simulate('click');
      // test if modal pop up when click the delete button
      expect(component.find(confirmModalIdentifier).exists()).toBe(true);

      act(() => {
        // @ts-ignore
        component.find(confirmModalIdentifier).first().props().onCancel();
      });

      component.update();
      expect(component.find(confirmModalIdentifier).exists()).toBe(false);
    });
    test('should show confirm delete modal pop up on trash icon click and confirm button should delete datasource', () => {
      component.find(deleteIconIdentifier).first().simulate('click');
      // test if modal pop up when click the delete button
      expect(component.find(confirmModalIdentifier).exists()).toBe(true);

      act(() => {
        // @ts-ignore
        component.find(confirmModalIdentifier).first().props().onConfirm();
      });

      component.update();
      expect(component.find(confirmModalIdentifier).exists()).toBe(false);
    });
  });
  describe('do not show delete icon', () => {
    beforeEach(() => {
      component = mount(
        wrapWithIntl(
          <Header
            isFormValid={false}
            showDeleteIcon={false}
            onClickDeleteIcon={mockFn}
            onClickTestConnection={mockFn}
            dataSourceName={dataSourceName}
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
      expect(component.find(headerTitleIdentifier).last().text()).toBe(dataSourceName);
      expect(component.find(deleteIconIdentifier).exists()).toBe(false);
    });
  });
});
