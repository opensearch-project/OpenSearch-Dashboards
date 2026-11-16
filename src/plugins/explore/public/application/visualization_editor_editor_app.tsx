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
import { useEditorSessionKey } from './in_context_vis_editor/hooks/use_editor_session_key';

/**
 * One editing session per key: a navigation that isn't a REPLACE (back / forward, a PUSH to another
 * vis, saving a new vis) remounts the container and the page, which then read the new URL.
 */
export const EditorSession = ({
  setHeaderActionMenu,
}: Pick<AppMountParameters, 'setHeaderActionMenu'>) => {
  const sessionKey = useEditorSessionKey();
  return (
    <MultiQueryBuilderProvider key={sessionKey}>
      <VisualizationEditorPage setHeaderActionMenu={setHeaderActionMenu} />
    </MultiQueryBuilderProvider>
  );
};

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
              <EditorSession setHeaderActionMenu={setHeaderActionMenu} />
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
