/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { MountPoint } from 'opensearch-dashboards/public';
import { mountWithIntl, shallowWithIntl } from 'test_utils/enzyme_helpers';
import { TopNavMenu, TopNavMenuItemRenderType } from './top_nav_menu';
import { TopNavMenuData } from './top_nav_menu_data';
import { applicationServiceMock, uiSettingsServiceMock } from '../../../../core/public/mocks';
import * as testUtils from '../../../data_source_management/public/components/utils';
import { DataSourceSelectionService } from '../../../data_source_management/public/service/data_source_selection_service';

const dataShim = {
  ui: {
    SearchBar: () => <div className="searchBar" />,
  },
};

describe('TopNavMenu', () => {
  const TOP_NAV_ITEM_SELECTOR = 'TopNavMenuItem';
  const SEARCH_BAR_SELECTOR = 'SearchBar';
  const menuItems: TopNavMenuData[] = [
    {
      id: 'test',
      label: 'test',
      run: jest.fn(),
    },
    {
      id: 'test2',
      label: 'test2',
      run: jest.fn(),
    },
    {
      id: 'test3',
      label: 'test3',
      run: jest.fn(),
    },
  ];
  const dataSourceSelection = new DataSourceSelectionService();

  it('Should render nothing when no config is provided', () => {
    const component = shallowWithIntl(<TopNavMenu appName={'test'} />);
    expect(component.find(TOP_NAV_ITEM_SELECTOR).length).toBe(0);
    expect(component.find(SEARCH_BAR_SELECTOR).length).toBe(0);
  });

  it('Should not render menu items when config is empty', () => {
    const component = shallowWithIntl(<TopNavMenu appName={'test'} config={[]} />);
    expect(component.find(TOP_NAV_ITEM_SELECTOR).length).toBe(0);
    expect(component.find(SEARCH_BAR_SELECTOR).length).toBe(0);
  });

  it('Should render 1 menu item', () => {
    const component = shallowWithIntl(<TopNavMenu appName={'test'} config={[menuItems[0]]} />);
    expect(component.find(TOP_NAV_ITEM_SELECTOR).length).toBe(1);
    expect(component.find(SEARCH_BAR_SELECTOR).length).toBe(0);
  });

  it('Should render multiple menu items', () => {
    const component = shallowWithIntl(<TopNavMenu appName={'test'} config={menuItems} />);
    expect(component.find(TOP_NAV_ITEM_SELECTOR).length).toBe(menuItems.length);
    expect(component.find(SEARCH_BAR_SELECTOR).length).toBe(0);
  });

  it('Should render search bar', () => {
    const component = shallowWithIntl(
      <TopNavMenu appName={'test'} showSearchBar={true} data={dataShim as any} />
    );
    expect(component.find(TOP_NAV_ITEM_SELECTOR).length).toBe(0);
    expect(component.find(SEARCH_BAR_SELECTOR).length).toBe(1);
  });

  it('Should render menu items and search bar', () => {
    const component = shallowWithIntl(
      <TopNavMenu appName={'test'} config={menuItems} showSearchBar={true} data={dataShim as any} />
    );
    expect(component.find(TOP_NAV_ITEM_SELECTOR).length).toBe(menuItems.length);
    expect(component.find(SEARCH_BAR_SELECTOR).length).toBe(1);
  });

  it('Should render with a class name', () => {
    const component = shallowWithIntl(
      <TopNavMenu
        appName={'test'}
        config={menuItems}
        showSearchBar={true}
        data={dataShim as any}
        className={'myCoolClass'}
      />
    );
    expect(component.find('.osdTopNavMenu').length).toBe(1);
    expect(component.find('.myCoolClass').length).toBeTruthy();
  });

  it('mounts the data source menu if showDataSourceMenu is true', async () => {
    spyOn(testUtils, 'getApplication').and.returnValue({ id: 'test2' });
    spyOn(testUtils, 'getUiSettings').and.returnValue({ id: 'test2' });
    spyOn(testUtils, 'getHideLocalCluster').and.returnValue(true);
    spyOn(testUtils, 'getDataSourceSelection').and.returnValue(dataSourceSelection);
    const component = shallowWithIntl(
      <TopNavMenu
        appName={'test'}
        showDataSourceMenu={true}
        dataSourceMenuConfig={{
          componentType: 'DataSourceView',
          componentConfig: {
            hideLocalCluster: true,
            fullWidth: true,
            activeOption: [{ label: 'what', id: '1' }],
          },
          dataSourceSelection,
        }}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('mounts the data source menu as well as top nav menu', async () => {
    spyOn(testUtils, 'getApplication').and.returnValue({ id: 'test2' });
    spyOn(testUtils, 'getUiSettings').and.returnValue({ id: 'test2' });
    spyOn(testUtils, 'getHideLocalCluster').and.returnValue(true);
    spyOn(testUtils, 'getDataSourceSelection').and.returnValue(dataSourceSelection);

    const component = shallowWithIntl(
      <TopNavMenu
        appName={'test'}
        showDataSourceMenu={true}
        config={menuItems}
        dataSourceMenuConfig={{
          componentType: 'DataSourceView',
          componentConfig: {
            hideLocalCluster: true,
            fullWidth: true,
            activeOption: [{ label: 'what', id: '1' }],
          },
          dataSourceSelection: new DataSourceSelectionService(),
        }}
      />
    );

    expect(component).toMatchSnapshot();
    expect(component.find(TOP_NAV_ITEM_SELECTOR).length).toBe(menuItems.length);
  });

  describe('when setMenuMountPoint is provided', () => {
    let portalTarget: HTMLElement;
    let mountPoint: MountPoint;
    let setMountPoint: jest.Mock<(mountPoint: MountPoint<HTMLElement>) => void>;
    let dom: ReactWrapper;

    const refresh = () => {
      new Promise(async (resolve) => {
        if (dom) {
          act(() => {
            dom.update();
          });
        }
        setImmediate(() => resolve(dom)); // flushes any pending promises
      });
    };

    beforeEach(() => {
      portalTarget = document.createElement('div');
      document.body.append(portalTarget);
      setMountPoint = jest.fn().mockImplementation((mp) => (mountPoint = mp));
    });

    afterEach(() => {
      if (portalTarget) {
        portalTarget.remove();
      }
    });

    it('mounts the menu inside the provided mountPoint', async () => {
      const component = mountWithIntl(
        <TopNavMenu
          appName={'test'}
          config={menuItems}
          showSearchBar={true}
          data={dataShim as any}
          setMenuMountPoint={setMountPoint}
        />
      );

      act(() => {
        mountPoint(portalTarget);
      });

      await refresh();

      expect(component.find(SEARCH_BAR_SELECTOR).length).toBe(1);

      // menu is rendered outside of the component
      expect(component.find(TOP_NAV_ITEM_SELECTOR).length).toBe(0);
    });

    it('mounts the data source menu with group actions enabled', async () => {
      spyOn(testUtils, 'getApplication').and.returnValue(applicationServiceMock);
      spyOn(testUtils, 'getUiSettings').and.returnValue(
        uiSettingsServiceMock.createStartContract()
      );
      spyOn(testUtils, 'getHideLocalCluster').and.returnValue(true);
      spyOn(testUtils, 'getDataSourceSelection').and.returnValue(dataSourceSelection);

      const component = mountWithIntl(
        <TopNavMenu
          appName={'test'}
          showDataSourceMenu={true}
          config={menuItems}
          dataSourceMenuConfig={{
            componentType: 'DataSourceView',
            componentConfig: {
              hideLocalCluster: true,
              fullWidth: true,
              activeOption: [{ label: 'what', id: '1' }],
            },
            dataSourceSelection: new DataSourceSelectionService(),
          }}
          groupActions={true}
          setMenuMountPoint={setMountPoint}
        />
      );

      act(() => {
        mountPoint(portalTarget);
      });

      await refresh();
      expect(component.find('.osdTopNavMenuScreenTitle').exists()).toBeFalsy();
      expect(component.find(SEARCH_BAR_SELECTOR).length).toBe(0);
    });

    it('mounts without data source menu with group actions enabled and showSearchBar in portal', async () => {
      spyOn(testUtils, 'getApplication').and.returnValue(applicationServiceMock);
      spyOn(testUtils, 'getUiSettings').and.returnValue(
        uiSettingsServiceMock.createStartContract()
      );
      spyOn(testUtils, 'getHideLocalCluster').and.returnValue(false);
      spyOn(testUtils, 'getDataSourceSelection').and.returnValue(dataSourceSelection);

      const component = mountWithIntl(
        <TopNavMenu
          appName={'test'}
          showDataSourceMenu={true}
          config={menuItems}
          showSearchBar={TopNavMenuItemRenderType.IN_PORTAL}
          groupActions={true}
          setMenuMountPoint={setMountPoint}
        />
      );

      act(() => {
        mountPoint(portalTarget);
      });

      await refresh();

      await (() => {
        expect(component.find(SEARCH_BAR_SELECTOR).length).toBe(1);
        expect(component.find('.osdTopNavMenuScreenTitle').exists()).toBeTruthy();
      });
    });

    it('mounts without data source menu with group actions enabled and showSearchBar in place', async () => {
      spyOn(testUtils, 'getApplication').and.returnValue(applicationServiceMock);
      spyOn(testUtils, 'getUiSettings').and.returnValue(
        uiSettingsServiceMock.createStartContract()
      );
      spyOn(testUtils, 'getHideLocalCluster').and.returnValue(false);
      spyOn(testUtils, 'getDataSourceSelection').and.returnValue(dataSourceSelection);

      const component = mountWithIntl(
        <TopNavMenu
          appName={'test'}
          showDataSourceMenu={true}
          config={menuItems}
          showSearchBar={TopNavMenuItemRenderType.IN_PLACE}
          groupActions={true}
          setMenuMountPoint={setMountPoint}
          showDatePicker={TopNavMenuItemRenderType.IN_PORTAL}
        />
      );

      act(() => {
        mountPoint(portalTarget);
      });

      await refresh();

      await (() => {
        expect(component.find(SEARCH_BAR_SELECTOR).length).toBe(1);
        expect(component.find('.osdTopNavMenuScreenTitle').exists()).toBeTruthy();
        expect(component.find('.globalDatePicker').exists()).toBeTruthy();
      });
    });
  });
});
