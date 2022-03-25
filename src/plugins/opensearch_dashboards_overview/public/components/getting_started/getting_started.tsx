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

import React, { FC } from 'react';
import {
  EuiButton,
  EuiCard,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiImage,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { CoreStart } from 'opensearch-dashboards/public';
import {
  RedirectAppLinks,
  useOpenSearchDashboards,
} from '../../../../../../src/plugins/opensearch_dashboards_react/public';
import { FeatureCatalogueEntry } from '../../../../../../src/plugins/home/public';
import { PLUGIN_ID } from '../../../common';

interface Props {
  addBasePath: (path: string) => string;
  isDarkTheme: boolean;
  apps: FeatureCatalogueEntry[];
}

export const GettingStarted: FC<Props> = ({ addBasePath, isDarkTheme, apps }) => {
  const {
    services: { application },
  } = useOpenSearchDashboards<CoreStart>();
  const gettingStartedGraphicURL = `/plugins/${PLUGIN_ID}/assets/opensearch_dashboards_montage_${
    isDarkTheme ? 'dark' : 'light'
  }.svg`;

  return (
    <section
      aria-labelledby="osdOverviewGettingStarted__title"
      className="osdOverviewGettingStarted"
    >
      <EuiFlexGroup alignItems="center">
        <EuiFlexItem className="osdOverviewGettingStarted__content">
          <div>
            <EuiTitle size="s">
              <h2 id="osdOverviewGettingStarted__title">
                <FormattedMessage
                  id="opensearchDashboardsOverview.gettingStarted.title"
                  defaultMessage="Getting started with OpenSearch Dashboards"
                />
              </h2>
            </EuiTitle>

            <EuiSpacer size="m" />

            <EuiText>
              <p>
                <FormattedMessage
                  id="opensearchDashboardsOverview.gettingStarted.description"
                  defaultMessage="OpenSearch Dashboards empowers you to visualize your data, your way.  Start with one question, and see where the answer leads you."
                />
              </p>
            </EuiText>

            <EuiSpacer size="xl" />

            <EuiFlexGrid className="osdOverviewGettingStarted__apps" columns={2}>
              {apps.map(({ subtitle = '', icon, title }) => (
                <EuiFlexItem key={title}>
                  <EuiCard
                    description={subtitle}
                    display="plain"
                    icon={<EuiIcon color="text" size="l" type={icon} />}
                    layout="horizontal"
                    paddingSize="none"
                    title={title}
                    titleElement="h3"
                    titleSize="xs"
                  />
                </EuiFlexItem>
              ))}
            </EuiFlexGrid>

            <EuiSpacer size="xl" />

            <RedirectAppLinks application={application}>
              <EuiButton
                fill
                iconType="indexOpen"
                href={addBasePath('/app/management/opensearch-dashboards/indexPatterns')}
              >
                <FormattedMessage
                  defaultMessage="Add your data"
                  id="opensearchDashboardsOverview.gettingStarted.addDataButtonLabel"
                />
              </EuiButton>
            </RedirectAppLinks>
          </div>
        </EuiFlexItem>

        <EuiFlexItem className="osdOverviewGettingStarted__graphic">
          <EuiImage
            alt="OpenSearch Dashboards visualizations illustration"
            url={addBasePath(gettingStartedGraphicURL)}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </section>
  );
};
