/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Router, Route, Switch } from 'react-router-dom';
import { AppMountParameters } from '../../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../types';
import { InContextVisEditorPage } from './in_context_vis_editor/in_context_vis_editor_page';
import { updateVisualizationBuilderServices } from '../components/visualizations/visualization_builder';
import { InContextEditorProvider } from './context';

export const renderEditor = (
  { element, history, setHeaderActionMenu }: AppMountParameters,
  services: ExploreServices
) => {
  updateVisualizationBuilderServices(services);
  const originatingApp = services.embeddable
    .getStateTransfer(services.scopedHistory)
    .getIncomingEditorState()?.originatingApp;

  const root = createRoot(element);
  root.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <services.core.i18n.Context>
          <InContextEditorProvider originatingApp={originatingApp}>
            <Switch>
              <Route path={[`/edit/:id`, '/']} exact={false}>
                <InContextVisEditorPage setHeaderActionMenu={setHeaderActionMenu} />
              </Route>
            </Switch>
          </InContextEditorProvider>
        </services.core.i18n.Context>
      </OpenSearchDashboardsContextProvider>
    </Router>
  );

  return () => {
    root.unmount();
  };
};
