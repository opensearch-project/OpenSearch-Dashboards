/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppMountParameters } from '../../../../core/public';
import { WizardServices } from '../types';
import { WizardApp } from './app';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';

export const renderApp = (
  { appBasePath, element }: AppMountParameters,
  services: WizardServices
) => {
  ReactDOM.render(
    <Router basename={appBasePath}>
      <OpenSearchDashboardsContextProvider services={services}>
        <services.i18n.Context>
          <WizardApp />
        </services.i18n.Context>
      </OpenSearchDashboardsContextProvider>
    </Router>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
