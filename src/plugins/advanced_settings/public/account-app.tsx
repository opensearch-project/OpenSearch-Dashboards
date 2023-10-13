/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { CoreStart } from 'opensearch-dashboards/public';
import { HeaderUserMenu } from './header_user_menu';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';

export async function setupTopNavButton(coreStart: CoreStart) {
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
