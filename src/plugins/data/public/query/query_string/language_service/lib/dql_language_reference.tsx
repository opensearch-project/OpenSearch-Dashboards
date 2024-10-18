/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { EuiLink, EuiText } from '@elastic/eui';
import { IDataPluginServices } from '../../../../types';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { LanguageReference } from './language_reference';

const DqlReference = () => {
  const opensearchDashboards = useOpenSearchDashboards<IDataPluginServices>();
  const osdDQLDocs = opensearchDashboards.services.docLinks?.links.opensearchDashboards.dql.base;
  const dqlFullName = (
    <FormattedMessage
      id="data.query.queryBar.dqlFullLanguageName"
      defaultMessage="OpenSearch Dashboards Query Language"
    />
  );

  return (
    <>
      <EuiText size="s">
        <p>
          <FormattedMessage
            id="data.query.queryBar.dqlSyntaxOptionsDescription"
            defaultMessage="The {docsLink} (DQL) offers a simplified query syntax and support for scripted fields."
            values={{
              docsLink: (
                <EuiLink href={osdDQLDocs} target="_blank">
                  {dqlFullName}
                </EuiLink>
              ),
            }}
          />
        </p>
      </EuiText>
    </>
  );
};

export const dqlLanguageReference = () => {
  return <LanguageReference body={<DqlReference />} />;
};
