/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPage, EuiPageSideBar, EuiSideNav } from '@elastic/eui';
import { BrowserRouter as Router, Route, withRouter, RouteComponentProps } from 'react-router-dom';
import { AppMountContext, CoreStart, MountPoint } from 'opensearch-dashboards/public';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';
import { DataSourceListActiveExample } from './data_source_list_active_example';
import { DataSourceListAllExample } from './data_source_list_all_example';
import { DataSourceMultiSelectableExample } from './data_source_multi_selectable_example';
import { DataSourceSelectableExample } from './data_source_selectable_example';
import { DataSourceSelectorExample } from './data_source_selector_example';
import { DataSourceViaTopNavMenuExample } from './data_source_via_top_nav_menu';
import { DataSourceViewExample } from './data_source_view_example';

export interface HomeProps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  savedObjects: CoreStart['savedObjects'];
  uiSettings: CoreStart['uiSettings'];
  dataSourceEnabled: boolean;
  dataSourceManagement: DataSourceManagementPluginSetup;
  navigateToApp: CoreStart['application']['navigateToApp'];
  navigation: NavigationPublicPluginStart;
  setActionMenu?: (menuMount: MountPoint | undefined) => void;
}

interface PageDef {
  title: string;
  id: string;
  component: React.ReactNode;
}

type NavProps = RouteComponentProps & {
  navigateToApp: AppMountContext['core']['application']['navigateToApp'];
  pages: PageDef[];
};

const Nav = withRouter(({ history, pages }: NavProps) => {
  const navItems = pages.map((page) => ({
    id: page.id,
    name: page.title,
    onClick: () => history.push(`/${page.id}`),
    'data-test-subj': page.id,
  }));

  return (
    <EuiSideNav
      items={[
        {
          name: 'Multiple Data Source Integration Examples',
          id: 'home',
          items: [...navItems],
        },
      ]}
    />
  );
});

export const Home = ({
  basename,
  notifications,
  savedObjects,
  uiSettings,
  dataSourceEnabled,
  setActionMenu,
  dataSourceManagement,
  navigateToApp,
  navigation,
}: HomeProps) => {
  const pages = [
    {
      title: 'Data Source Selector',
      id: 'selector',
      component: (
        <DataSourceSelectorExample
          savedObjects={savedObjects}
          notifications={notifications}
          dataSourceEnabled={dataSourceEnabled}
          dataSourceManagement={dataSourceManagement}
        />
      ),
    },
    {
      title: 'Data Source Multi Selectable',
      id: 'multi_selectable',
      component: (
        <DataSourceMultiSelectableExample
          savedObjects={savedObjects}
          notifications={notifications}
          dataSourceEnabled={dataSourceEnabled}
          setActionMenu={setActionMenu}
          dataSourceManagement={dataSourceManagement}
        />
      ),
    },
    {
      title: 'Data Source Selectable',
      id: 'single_selectable',
      component: (
        <DataSourceSelectableExample
          savedObjects={savedObjects}
          notifications={notifications}
          dataSourceEnabled={dataSourceEnabled}
          setActionMenu={setActionMenu}
          dataSourceManagement={dataSourceManagement}
        />
      ),
    },
    {
      title: 'Data Source Readonly View',
      id: 'single_readonly',
      component: (
        <DataSourceViewExample
          savedObjects={savedObjects}
          notifications={notifications}
          dataSourceEnabled={dataSourceEnabled}
          setActionMenu={setActionMenu}
          dataSourceManagement={dataSourceManagement}
        />
      ),
    },
    {
      title: 'Data Source List All',
      id: 'list_all',
      component: (
        <DataSourceListAllExample
          savedObjects={savedObjects}
          notifications={notifications}
          dataSourceEnabled={dataSourceEnabled}
          setActionMenu={setActionMenu}
          dataSourceManagement={dataSourceManagement}
          uiSettings={uiSettings}
        />
      ),
    },
    {
      title: 'Data Source List Active',
      id: 'list_active',
      component: (
        <DataSourceListActiveExample
          savedObjects={savedObjects}
          notifications={notifications}
          dataSourceEnabled={dataSourceEnabled}
          setActionMenu={setActionMenu}
          dataSourceManagement={dataSourceManagement}
          uiSettings={uiSettings}
        />
      ),
    },
    {
      title: 'Data Source View Via Top Nav Menu',
      id: 'top_nav_menu',
      component: (
        <DataSourceViaTopNavMenuExample
          savedObjects={savedObjects}
          notifications={notifications}
          dataSourceEnabled={dataSourceEnabled}
          setActionMenu={setActionMenu}
          navigation={navigation}
        />
      ),
    },
  ];

  const routes = pages.map((page, i) => (
    <Route key={i} path={`/${page.id}`} render={(props) => page.component} />
  ));
  return (
    <Router basename={basename}>
      <EuiPage>
        <EuiPageSideBar>
          <Nav navigateToApp={navigateToApp} pages={pages} />
        </EuiPageSideBar>
        {routes}
      </EuiPage>
    </Router>
  );
};
