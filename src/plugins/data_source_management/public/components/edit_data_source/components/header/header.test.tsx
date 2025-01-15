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
const setDefaultButtonIdentifier = '[data-test-subj="editSetDefaultDataSource"]';

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
            onClickSetDefault={mockFn}
            isDefault={false}
            canManageDataSource={true}
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
            onClickSetDefault={mockFn}
            isDefault={false}
            canManageDataSource={true}
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
  describe('should render default icon as "Set as default" when isDefaultDataSourceState is false', () => {
    const onClickSetDefault = jest.fn();
    const isDefaultDataSourceState = false;
    beforeEach(() => {
      component = mount(
        wrapWithIntl(
          <Header
            isFormValid={true}
            showDeleteIcon={true}
            onClickDeleteIcon={mockFn}
            onClickTestConnection={mockFn}
            dataSourceName={dataSourceName}
            onClickSetDefault={onClickSetDefault}
            isDefault={isDefaultDataSourceState}
            canManageDataSource={true}
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
      expect(component.find(setDefaultButtonIdentifier).exists()).toBe(true);
    });
    test('should not change to default if onClickSetDefault returns false', async () => {
      onClickSetDefault.mockReturnValue(false);
      expect(component.find(setDefaultButtonIdentifier).first().text()).toBe('Set as default');
      component.find(setDefaultButtonIdentifier).first().simulate('click');
      expect(onClickSetDefault).toHaveBeenCalled();
      component.update();
      expect(component.find(setDefaultButtonIdentifier).first().text()).toBe('Set as default');
    });

    test('should update isDefaultDataSourceState to true if onClickSetDefault returns true', async () => {
      onClickSetDefault.mockReturnValue(true);
      expect(component.find(setDefaultButtonIdentifier).first().text()).toBe('Set as default');

      await act(async () => {
        component.find(setDefaultButtonIdentifier).first().simulate('click');
      });

      expect(onClickSetDefault).toHaveBeenCalled();
      component.update();
      expect(component.find(setDefaultButtonIdentifier).first().text()).toBe('Default');
    });
    test('default button should show as "Set as default" and should be clickable', () => {
      expect(component.find(setDefaultButtonIdentifier).first().text()).toBe('Set as default');
      expect(component.find(setDefaultButtonIdentifier).first().prop('disabled')).toBe(false);
      expect(component.find(setDefaultButtonIdentifier).first().prop('iconType')).toBe('starEmpty');
      component.find(setDefaultButtonIdentifier).first().simulate('click');
      expect(onClickSetDefault).toHaveBeenCalled();
    });
  });
  describe('should render default icon as "Default" when isDefaultDataSourceState is true', () => {
    const onClickSetDefault = jest.fn();
    const isDefaultDataSourceState = true;
    beforeEach(() => {
      component = mount(
        wrapWithIntl(
          <Header
            isFormValid={true}
            showDeleteIcon={true}
            onClickDeleteIcon={mockFn}
            onClickTestConnection={mockFn}
            dataSourceName={dataSourceName}
            onClickSetDefault={onClickSetDefault}
            isDefault={isDefaultDataSourceState}
            canManageDataSource={true}
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
      expect(component.find(setDefaultButtonIdentifier).exists()).toBe(true);
    });
    test('default button should show as "Default" and should be disabled.', () => {
      expect(component.find(setDefaultButtonIdentifier).first().text()).toBe('Default');
      expect(component.find(setDefaultButtonIdentifier).first().prop('disabled')).toBe(true);
      expect(component.find(setDefaultButtonIdentifier).first().prop('iconType')).toBe(
        'starFilled'
      );
    });
  });
  describe('should not manage data source', () => {
    beforeEach(() => {
      component = mount(
        wrapWithIntl(
          <Header
            isFormValid={true}
            showDeleteIcon={true}
            onClickDeleteIcon={mockFn}
            onClickTestConnection={mockFn}
            dataSourceName={dataSourceName}
            onClickSetDefault={mockFn}
            isDefault={false}
            canManageDataSource={false}
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
    test('should not show delete', () => {
      expect(component.find(headerTitleIdentifier).last().text()).toBe(dataSourceName);
      expect(component.find(deleteIconIdentifier).exists()).toBe(false);
    });
  });
});
