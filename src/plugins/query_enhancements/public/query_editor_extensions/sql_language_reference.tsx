/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { EuiLink, EuiText } from '@elastic/eui';
import { IDataPluginServices } from 'src/plugins/data/public';
import { LanguageReference } from '../../../data/public';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
const SQLReference = () => {
  const opensearchDashboards = useOpenSearchDashboards<IDataPluginServices>();
  const sqlDocs = opensearchDashboards.services.docLinks?.links.noDocumentation.sql.base;
  const sqlFullName = (
    <FormattedMessage id="queryEnhancements.queryBar.sqlFullLanguageName" defaultMessage="SQL" />
  );

  return (
    <>
      <EuiText size="s">
        <p>
          <FormattedMessage
            id="queryEnhancements.queryBar.sqlSyntaxOptionsDescription"
            defaultMessage="{docsLink} in OpenSearch bridges the gap between traditional relational database concepts and the flexibility of OpenSearch’s document-oriented data storage. This integration gives you the ability to use your SQL knowledge to query, analyze, and extract insights from your OpenSearch data."
            values={{
              docsLink: (
                <EuiLink href={sqlDocs} target="_blank">
                  {sqlFullName}
                </EuiLink>
              ),
            }}
          />
        </p>
      </EuiText>
    </>
  );
};

export const sqlLanguageReference = () => {
  return <LanguageReference body={<SQLReference />} />;
};
