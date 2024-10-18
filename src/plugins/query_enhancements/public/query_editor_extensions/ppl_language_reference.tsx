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
const PPLReference = () => {
  const opensearchDashboards = useOpenSearchDashboards<IDataPluginServices>();
  const pplDocs = opensearchDashboards.services.docLinks?.links.noDocumentation.ppl.base;
  const pplFullName = (
    <FormattedMessage id="queryEnhancements.queryBar.pplFullLanguageName" defaultMessage="PPL" />
  );

  return (
    <>
      <EuiText size="s">
        <p>
          <FormattedMessage
            id="queryEnhancements.queryBar.pplSyntaxOptionsDescription"
            defaultMessage="Piped Processing Language ({docsLink}) is a query language that focuses on processing data in a sequential, step-by-step manner. PPL uses the pipe (|) operator to combine commands to find and retrieve data. It is particularly well suited for analyzing observability data, such as logs, metrics, and traces, due to its ability to handle semi-structured data efficiently."
            values={{
              docsLink: (
                <EuiLink href={pplDocs} target="_blank">
                  {pplFullName}
                </EuiLink>
              ),
            }}
          />
        </p>
      </EuiText>
    </>
  );
};

export const pplLanguageReference = () => {
  return <LanguageReference body={<PPLReference />} />;
};
