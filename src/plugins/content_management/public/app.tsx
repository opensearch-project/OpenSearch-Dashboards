/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Router, Switch } from 'react-router-dom';
import { I18nProvider } from '@osd/i18n/react';

import {
  AppMountParameters,
  CoreStart,
  SavedObjectsClientContract,
} from 'opensearch-dashboards/public';
import { PageRender } from './components/page_render';
import { Page } from './services';
import { ContentManagementPluginStartDependencies } from './types';
import { EmbeddableStart } from '../../embeddable/public';

interface Props {
  params: AppMountParameters;
  pages: Page[];
  coreStart: CoreStart;
  depsStart: ContentManagementPluginStartDependencies;
}

export const renderPage = ({
  page,
  embeddable,
  savedObjectsClient,
}: {
  page: Page;
  embeddable: EmbeddableStart;
  savedObjectsClient: SavedObjectsClientContract;
}) => {
  return <PageRender page={page} embeddable={embeddable} savedObjectsClient={savedObjectsClient} />;
};

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
              {renderPage({
                page,
                embeddable: depsStart.embeddable,
                savedObjectsClient: coreStart.savedObjects.client,
              })}
            </Route>
          ))}
        </Switch>
      </Router>
    </I18nProvider>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
