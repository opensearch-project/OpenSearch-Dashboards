/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiBetaBadge, EuiSpacer, EuiTitle, EuiText, EuiCode, EuiLink } from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DocLinksStart } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../../../types';

export const Header = ({
  prompt,
  dataSourceName,
  isBeta = false,
  docLinks,
}: {
  prompt?: React.ReactNode;
  dataSourceName: string;
  isBeta?: boolean;
  docLinks?: DocLinksStart; // todo: ck
}) => {
  const changeTitle = useOpenSearchDashboards<DataSourceManagementContext>().services.chrome
    .docTitle.change;

  const createDataSourceHeader = i18n.translate('dataSourcesManagement.createDataSourceHeader', {
    defaultMessage: 'Create {dataSourceName}',
    values: { dataSourceName },
  });

  changeTitle(createDataSourceHeader);

  return (
    <div>
      <EuiTitle>
        <h1>
          {createDataSourceHeader}
          {isBeta ? (
            <>
              <EuiBetaBadge
                label={i18n.translate('dataSourcesManagement.createDataSource.betaLabel', {
                  defaultMessage: 'Beta',
                })}
              />
            </>
          ) : null}
        </h1>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText>
        <p>
          <FormattedMessage
            id="dataSourcesManagement.createDataSource.description"
            defaultMessage="A data source is an OpenSearch cluster endpoint (for now) to query against."
            values={{
              multiple: <strong>multiple</strong>,
              single: <EuiCode>filebeat-4-3-22</EuiCode>,
              star: <EuiCode>filebeat-*</EuiCode>,
            }}
          />
          <br />
          <EuiLink
            href={'https://www.youtube.com/'} // todo
            target="_blank"
            external
          >
            <FormattedMessage
              id="dataSourcesManagement.createDataSource.documentation"
              defaultMessage="Read documentation"
            />
          </EuiLink>
        </p>
      </EuiText>
      {prompt ? (
        <>
          <EuiSpacer size="m" />
          {prompt}
        </>
      ) : null}
    </div>
  );
};
