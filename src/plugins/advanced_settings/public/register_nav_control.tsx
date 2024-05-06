/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { CoreStart } from 'opensearch-dashboards/public';
import { OpenSearchDashboardsContextProvider } from '../../opensearch_dashboards_react/public';
import { HeaderUserThemeMenu } from './header_user_theme_menu';

export async function setupTopNavThemeButton(coreStart: CoreStart) {
  coreStart.chrome.navControls.registerRight({
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
