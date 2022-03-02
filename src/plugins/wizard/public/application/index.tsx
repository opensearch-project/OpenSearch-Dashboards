/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Store } from 'redux';
import { AppMountParameters } from '../../../../core/public';
import { WizardServices } from '../types';
import { WizardApp } from './app';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';

export const renderApp = (
  { appBasePath, element }: AppMountParameters,
  services: WizardServices,
  store: Store
) => {
  ReactDOM.render(
    <Router basename={appBasePath}>
      <OpenSearchDashboardsContextProvider services={services}>
        <ReduxProvider store={store}>
          <services.i18n.Context>
            <WizardApp />
          </services.i18n.Context>
        </ReduxProvider>
      </OpenSearchDashboardsContextProvider>
    </Router>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
