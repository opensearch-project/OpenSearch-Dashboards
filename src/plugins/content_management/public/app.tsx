import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Router, Switch } from 'react-router-dom';
import { I18nProvider } from '@osd/i18n/react';

import { AppMountParameters, CoreStart } from 'opensearch-dashboards/public';
import { PageRender } from './components/page_render';
import { Page } from './services';
import { ContentManagementPluginStartDependencies } from './types';

interface Props {
  params: AppMountParameters;
  pages: Page[];
  coreStart: CoreStart;
  depsStart: ContentManagementPluginStartDependencies;
}

export const renderApp = (
  { params, pages, coreStart, depsStart }: Props,
  element: AppMountParameters['element']
) => {
  console.log('pages: ', pages);
  ReactDOM.render(
    <I18nProvider>
      <Router history={params.history}>
        <Switch>
          {pages.map((page) => (
            <Route path={[`/${page.config.id}`]}>
              <PageRender page={page} embeddable={depsStart.embeddable} />
            </Route>
          ))}
        </Switch>
      </Router>
    </I18nProvider>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
