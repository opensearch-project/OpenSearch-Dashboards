/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiSpacer, EuiTitle, EuiText, EuiLink, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { DocLinksStart } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../../../types';
import { CREATE_DATA_SOURCE_HEADER } from '../../../text_content';

export const Header = ({ docLinks }: { docLinks: DocLinksStart }) => {
  const changeTitle = useOpenSearchDashboards<DataSourceManagementContext>().services.chrome
    .docTitle.change;

  changeTitle(CREATE_DATA_SOURCE_HEADER);

  return (
    <EuiFlexGroup justifyContent="spaceBetween">
      <EuiFlexItem grow={false}>
        <div>
          <EuiTitle>
            <h1 data-test-subj="createDataSourceHeader">{CREATE_DATA_SOURCE_HEADER}</h1>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText>
            <p>
              <FormattedMessage
                id="dataSourcesManagement.createDataSource.description"
                defaultMessage="A data source is an OpenSearch cluster endpoint (for now) to query against."
              />
              <br />
              <EuiLink
                href={docLinks.links.noDocumentation.indexPatterns.introduction}
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
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
