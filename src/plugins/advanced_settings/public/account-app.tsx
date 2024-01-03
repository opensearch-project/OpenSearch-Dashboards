/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { CoreStart } from 'opensearch-dashboards/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { HeaderUserMenu } from './header_user_menu';
import { HeaderUserThemeMenu } from './header_user_theme_menu';

export async function setupTopNavUserButton(coreStart: CoreStart) {
  coreStart.chrome.navControls.registerRight({
    // Pin to rightmost, since newsfeed plugin is using 1000, here needs a number > 1000
    order: 2000,
    mount: (element: HTMLElement) => {
      ReactDOM.render(
        <OpenSearchDashboardsContextProvider
          services={{
            ...coreStart,
          }}
        >
          <HeaderUserMenu />
        </OpenSearchDashboardsContextProvider>,
        element
      );
      return () => ReactDOM.unmountComponentAtNode(element);
    },
  });
}

export async function setupTopNavThemeButton(coreStart: CoreStart) {
  coreStart.chrome.navControls.registerRight({
    // Pin to rightmost, since newsfeed plugin is using 1000, here needs a number > 1000
    order: 2001,
    mount: (element: HTMLElement) => {
      ReactDOM.render(
        <OpenSearchDashboardsContextProvider
          services={{
            ...coreStart,
          }}
        >
          <HeaderUserThemeMenu />
        </OpenSearchDashboardsContextProvider>,
        element
      );
      return () => ReactDOM.unmountComponentAtNode(element);
    },
  });
}
