/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Switch } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Store } from 'redux';
import { AppMountParameters } from '../../../../core/public';
import { WizardServices } from '../types';
import { WizardApp } from './app';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { EDIT_PATH } from '../../common';

export const renderApp = (
  { element, history }: AppMountParameters,
  services: WizardServices,
  store: Store
) => {
  ReactDOM.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <ReduxProvider store={store}>
          <services.i18n.Context>
            <Switch>
              <Route path={[`${EDIT_PATH}/:id`, '/']} exact={false}>
                <WizardApp />
              </Route>
            </Switch>
          </services.i18n.Context>
        </ReduxProvider>
      </OpenSearchDashboardsContextProvider>
    </Router>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
