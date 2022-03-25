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
import PropTypes from 'prop-types';
import { EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiSpacer, EuiTitle } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { CoreStart } from 'opensearch-dashboards/public';
import {
  RedirectAppLinks,
  useOpenSearchDashboards,
} from '../../../../../../src/plugins/opensearch_dashboards_react/public';
import { FeatureCatalogueEntry } from '../../../../../../src/plugins/home/public';
// @ts-expect-error untyped component
import { Synopsis } from '../synopsis';

interface Props {
  addBasePath: (path: string) => string;
  features: FeatureCatalogueEntry[];
}

export const ManageData: FC<Props> = ({ addBasePath, features }) => {
  const {
    services: { application },
  } = useOpenSearchDashboards<CoreStart>();
  return (
    <>
      {features.length > 1 ? <EuiHorizontalRule margin="xl" aria-hidden="true" /> : null}

      {features.length > 0 ? (
        <section
          className="osdOverviewDataManage"
          aria-labelledby="osdOverviewDataManage__title"
          data-test-subj="osdOverviewDataManage"
        >
          <EuiTitle size="s">
            <h2 id="osdOverviewDataManage__title">
              <FormattedMessage
                id="opensearchDashboardsOverview.manageData.sectionTitle"
                defaultMessage="Manage your data"
              />
            </h2>
          </EuiTitle>

          <EuiSpacer size="m" />

          <EuiFlexGroup className="osdOverviewDataManage__content" wrap>
            {features.map((feature) => (
              <EuiFlexItem className="osdOverviewDataManage__item" key={feature.id}>
                <RedirectAppLinks application={application}>
                  <Synopsis
                    id={feature.id}
                    description={feature.description}
                    iconType={feature.icon}
                    title={feature.title}
                    url={addBasePath(feature.path)}
                    wrapInPanel
                  />
                </RedirectAppLinks>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </section>
      ) : null}
    </>
  );
};

ManageData.propTypes = {
  features: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      showOnHomePage: PropTypes.bool.isRequired,
      category: PropTypes.string.isRequired,
      order: PropTypes.number,
    })
  ),
};
