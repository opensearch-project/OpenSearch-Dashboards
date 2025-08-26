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

import React from 'react';

import { EuiBetaBadge, EuiSpacer, EuiText } from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { DocLinksStart } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../../types';
import { Description } from './description';

export const Header = ({
  prompt,
  datasetName,
  isBeta = false,
  docLinks,
}: {
  prompt?: React.ReactNode;
  datasetName: string;
  isBeta?: boolean;
  docLinks: DocLinksStart;
}) => {
  const changeTitle = useOpenSearchDashboards<DatasetManagmentContext>().services.chrome.docTitle
    .change;
  const createDatasetHeader = i18n.translate('datasetManagement.createDatasetHeader', {
    defaultMessage: 'Create {datasetName}',
    values: { datasetName },
  });

  changeTitle(createDatasetHeader);

  return (
    <div>
      <EuiText size="s">
        <h1>
          {createDatasetHeader}
          {isBeta ? (
            <>
              {' '}
              <EuiBetaBadge
                label={i18n.translate('datasetManagement.createDataset.betaLabel', {
                  defaultMessage: 'Beta',
                })}
              />
            </>
          ) : null}
        </h1>
      </EuiText>
      <EuiSpacer size="s" />
      <Description docLinks={docLinks} />
      {prompt ? (
        <>
          <EuiSpacer size="m" />
          {prompt}
        </>
      ) : null}
    </div>
  );
};
