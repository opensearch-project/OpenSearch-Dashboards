/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';
import { Router, Route, Switch } from 'react-router-dom';
import { AppMountParameters } from '../../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../types';
import { VisualizationEditorPage } from './in_context_vis_editor/visualization_editor_page';
import { MultiQueryBuilderProvider } from './in_context_vis_editor/multi_query_builder/multi_query_builder_context';

export const renderEditor = (
  { element, history, setHeaderActionMenu }: AppMountParameters,
  services: ExploreServices
) => {
  const root = createRoot(element);
  root.render(
    <Router history={history}>
      <OpenSearchDashboardsContextProvider services={services}>
        <services.core.i18n.Context>
          <Switch>
            <Route path={[`/edit/:id`, '/']} exact={false}>
              <MultiQueryBuilderProvider>
                <VisualizationEditorPage setHeaderActionMenu={setHeaderActionMenu} />
              </MultiQueryBuilderProvider>
            </Route>
          </Switch>
        </services.core.i18n.Context>
      </OpenSearchDashboardsContextProvider>
    </Router>
  );

  return () => {
    root.unmount();
  };
};
