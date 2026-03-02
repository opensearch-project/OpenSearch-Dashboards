/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { snakeCase } from 'lodash';
import React, { FC, useState, useEffect } from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiScreenReaderOnly,
  EuiSpacer,
  EuiTitle,
  EuiToken,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { CoreStart, Logos } from 'opensearch-dashboards/public';
import {
  RedirectAppLinks,
  useOpenSearchDashboards,
  OverviewPageFooter,
  OverviewPageHeader,
} from '../../../../../../src/plugins/opensearch_dashboards_react/public';
import { FetchResult } from '../../../../../../src/plugins/newsfeed/public';
import {
  FeatureCatalogueEntry,
  FeatureCatalogueSolution,
  FeatureCatalogueCategory,
} from '../../../../../../src/plugins/home/public';
import { PLUGIN_ID, PLUGIN_PATH } from '../../../common';
import { AppPluginStartDependencies } from '../../types';
import { GettingStarted } from '../getting_started';
import { ManageData } from '../manage_data';
import { NewsFeed } from '../news_feed';

const sortByOrder = (featureA: FeatureCatalogueEntry, featureB: FeatureCatalogueEntry) =>
  (featureA.order || Infinity) - (featureB.order || Infinity);

interface Props {
  newsFetchResult: FetchResult | null | void;
  solutions: FeatureCatalogueSolution[];
  features: FeatureCatalogueEntry[];
  logos: Logos;
}

export const Overview: FC<Props> = ({ newsFetchResult, solutions, features, logos }) => {
  const [isNewOpenSearchDashboardsInstance, setNewOpenSearchDashboardsInstance] = useState(false);
  const {
    services: { http, data, uiSettings, application },
  } = useOpenSearchDashboards<CoreStart & AppPluginStartDependencies>();
  const addBasePath = http.basePath.prepend;
  const indexPatternService = data.indexPatterns;
  const IS_DARK_THEME = uiSettings.get('theme:darkMode');

  const getFeaturesByCategory = (category: string) =>
    features
      .filter((feature) => feature.showOnHomePage && feature.category === category)
      .sort(sortByOrder);

  const getSolutionGraphicURL = (solutionId: string) =>
    `/plugins/${PLUGIN_ID}/assets/solutions_${solutionId}_${
      IS_DARK_THEME ? 'dark' : 'light'
    }_2x.png`;

  const findFeatureById = (featureId: string) => features.find(({ id }) => id === featureId);
  const opensearchDashboardsApps = features
    .filter(({ solutionId }) => solutionId === 'opensearchDashboards')
    .sort(sortByOrder);
  const addDataFeatures = getFeaturesByCategory(FeatureCatalogueCategory.DATA);
  const manageDataFeatures = getFeaturesByCategory(FeatureCatalogueCategory.ADMIN);
  const devTools = findFeatureById('console');

  // Show card for console if none of the manage data plugins are available, most likely in OSS
  if (manageDataFeatures.length < 1 && devTools) {
    manageDataFeatures.push(devTools);
  }

  useEffect(() => {
    const fetchIsNewOpenSearchDashboardsInstance = async () => {
      const resp = await indexPatternService.getTitles();

      setNewOpenSearchDashboardsInstance(resp.length === 0);
    };

    fetchIsNewOpenSearchDashboardsInstance();
  }, [indexPatternService]);

  const renderAppCard = (appId: string) => {
    const app = opensearchDashboardsApps.find(({ id }) => id === appId);

    return app ? (
      <EuiFlexItem className="osdOverviewApps__item" key={appId}>
        <RedirectAppLinks application={application}>
          <EuiCard
            description={app?.subtitle || ''}
            href={addBasePath(app.path)}
            // image={addBasePath(
            //  `/plugins/${PLUGIN_ID}/assets/opensearch_dashboards_${appId}_${
            //    IS_DARK_THEME ? 'dark' : 'light'
            //  }.svg`
            // )}
            title={app.title}
            titleElement="h3"
            titleSize="s"
          />
        </RedirectAppLinks>
      </EuiFlexItem>
    ) : null;
  };

  // Dashboard and discover are displayed in larger cards
  const mainApps = ['dashboard', 'discover'];
  const remainingApps = opensearchDashboardsApps
    .map(({ id }) => id)
    .filter((id) => !mainApps.includes(id));

  return (
    <main aria-labelledby="osdOverviewPageHeader__title" className="osdOverviewWrapper">
      <OverviewPageHeader
        addBasePath={addBasePath}
        hideToolbar={isNewOpenSearchDashboardsInstance}
        showIcon={true}
        title={
          <FormattedMessage
            defaultMessage="OpenSearch Dashboards"
            id="opensearchDashboardsOverview.header.title"
          />
        }
        logos={logos}
      />

      <div className="osdOverviewContent">
        {isNewOpenSearchDashboardsInstance ? (
          <GettingStarted
            addBasePath={addBasePath}
            isDarkTheme={IS_DARK_THEME}
            apps={opensearchDashboardsApps}
          />
        ) : (
          <>
            <section aria-labelledby="osdOverviewApps__title" className="osdOverviewApps">
              <EuiScreenReaderOnly>
                <h2 id="osdOverviewApps__title">
                  <FormattedMessage
                    id="opensearchDashboardsOverview.apps.title"
                    defaultMessage="Explore these apps"
                  />
                </h2>
              </EuiScreenReaderOnly>

              {mainApps.length ? (
                <>
                  <EuiFlexGroup
                    className="osdOverviewApps__group osdOverviewApps__group--primary"
                    justifyContent="center"
                  >
                    {mainApps.map(renderAppCard)}
                  </EuiFlexGroup>

                  <EuiSpacer size="l" />
                </>
              ) : null}

              {remainingApps.length ? (
                <EuiFlexGroup
                  className="osdOverviewApps__group osdOverviewApps__group--secondary"
                  justifyContent="center"
                >
                  {remainingApps.map(renderAppCard)}
                </EuiFlexGroup>
              ) : null}
            </section>

            <EuiHorizontalRule aria-hidden="true" margin="xl" />

            <EuiFlexGroup
              alignItems="flexStart"
              className={`osdOverviewSupplements ${
                newsFetchResult && newsFetchResult.feedItems.length
                  ? 'osdOverviewSupplements--hasNews'
                  : 'osdOverviewSupplements--noNews'
              }`}
            >
              {newsFetchResult && newsFetchResult.feedItems.length ? (
                <EuiFlexItem grow={1}>
                  <NewsFeed newsFetchResult={newsFetchResult} />
                </EuiFlexItem>
              ) : null}

              <EuiFlexItem grow={3}>
                {solutions.length ? (
                  <section aria-labelledby="osdOverviewMore__title" className="osdOverviewMore">
                    <EuiTitle size="s">
                      <h2 id="osdOverviewMore__title">
                        <FormattedMessage
                          id="opensearchDashboardsOverview.more.title"
                          defaultMessage="Do more with OpenSearch"
                        />
                      </h2>
                    </EuiTitle>

                    <EuiSpacer size="m" />

                    <EuiFlexGroup className="osdOverviewMore__content">
                      {solutions.map(({ id, title, description, icon, path }) => (
                        <EuiFlexItem className="osdOverviewMore__item" key={id}>
                          <RedirectAppLinks application={application}>
                            <EuiCard
                              className="osdOverviewSolution"
                              description={description ? description : ''}
                              href={addBasePath(path)}
                              icon={
                                <EuiToken
                                  className="osdOverviewSolution__icon"
                                  fill="light"
                                  iconType={icon}
                                  shape="circle"
                                  size="l"
                                />
                              }
                              image={addBasePath(getSolutionGraphicURL(snakeCase(id)))}
                              title={title}
                              titleElement="h3"
                              titleSize="xs"
                            />
                          </RedirectAppLinks>
                        </EuiFlexItem>
                      ))}
                    </EuiFlexGroup>
                  </section>
                ) : (
                  <EuiFlexGroup
                    className={`osdOverviewData ${
                      addDataFeatures.length === 1 && manageDataFeatures.length === 1
                        ? 'osdOverviewData--compressed'
                        : 'osdOverviewData--expanded'
                    }`}
                  >
                    <EuiFlexItem>
                      <ManageData addBasePath={addBasePath} features={manageDataFeatures} />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}

        <EuiHorizontalRule margin="xl" aria-hidden="true" />

        <OverviewPageFooter addBasePath={addBasePath} path={PLUGIN_PATH} />
      </div>
    </main>
  );
};
