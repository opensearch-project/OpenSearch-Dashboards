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
import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiTitle } from '@elastic/eui';
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

export const AddData: FC<Props> = ({ addBasePath, features }) => {
  const {
    services: { application },
  } = useOpenSearchDashboards<CoreStart>();

  return (
    <section className="osdOverviewDataAdd" aria-labelledby="osdOverviewDataAdd__title">
      <EuiFlexGroup alignItems="center">
        <EuiFlexItem grow={1}>
          <EuiTitle size="s">
            <h2 id="osdOverviewDataAdd__title">
              <FormattedMessage
                id="opensearchDashboardsOverview.addData.sectionTitle"
                defaultMessage="Ingest your data"
              />
            </h2>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiFlexGroup className="osdOverviewDataAdd__content">
        {features.map((feature) => (
          <EuiFlexItem key={feature.id}>
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
  );
};

AddData.propTypes = {
  addBasePath: PropTypes.func.isRequired,
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
