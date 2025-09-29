/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
