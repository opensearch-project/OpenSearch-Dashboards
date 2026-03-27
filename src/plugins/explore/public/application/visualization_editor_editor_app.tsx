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
import { VisualizationEditorPage } from './in_context_vis_editor/visualization_editor_page';
import { VisualizationEditorProvider } from './context';

export const renderEditor = (
  { element, history, setHeaderActionMenu }: AppMountParameters,
  services: ExploreServices
) => {
  const originatingApp = services.embeddable
    .getStateTransfer(services.scopedHistory)
    .getIncomingEditorState()?.originatingApp;

  const containerInfo = services.embeddable
    .getStateTransfer(services.scopedHistory)
    .getIncomingEditorState()?.containerInfo;

  const root = createRoot(element);
  root.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <services.core.i18n.Context>
          <VisualizationEditorProvider
            originatingApp={originatingApp}
            containerInfo={containerInfo}
          >
            <Switch>
              <Route path={[`/edit/:id`, '/']} exact={false}>
                <VisualizationEditorPage setHeaderActionMenu={setHeaderActionMenu} />
              </Route>
            </Switch>
          </VisualizationEditorProvider>
        </services.core.i18n.Context>
      </OpenSearchDashboardsContextProvider>
    </Router>
  );

  return () => {
    root.unmount();
  };
};
