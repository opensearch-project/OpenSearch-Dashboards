/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Switch, Router, Route, Redirect } from 'react-router-dom';
import { History } from 'history';
import { getServices } from '../../../opensearch_dashboards_services';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { SingleDocApp } from './single_doc_app';
import { SurroundingDocsApp } from './surrounding_docs_app';

export const docViewsRouter = (history: History) => {
  const services = getServices();
  if (services === undefined) return <div>{'loading...'}</div>;

  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <Router history={history}>
        <Switch>
          <Route path="/context/:indexPatternId/:id" component={SurroundingDocsApp} />
          <Route
            path="/doc/:indexPattern/:index/:type"
            render={(props) => (
              <Redirect
                to={`/doc/${props.match.params.indexPattern}/${props.match.params.index}`}
              />
            )}
          />
          <Route path="/doc/:indexPatternId/:index" component={SingleDocApp} />
        </Switch>
      </Router>
    </OpenSearchDashboardsContextProvider>
  );
};
