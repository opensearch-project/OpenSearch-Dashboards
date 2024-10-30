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
  const limitationDocs =
    opensearchDashboards.services.docLinks?.links.noDocumentation.sqlPplLimitation.base;
  const pplFullName = (
    <FormattedMessage id="queryEnhancements.queryBar.pplFullLanguageName" defaultMessage="PPL" />
  );
  const limitationsLink = (
    <FormattedMessage id="queryEnhancements.queryBar.pplLimitationDoc" defaultMessage="here" />
  );

  return (
    <>
      <EuiText size="s">
        <p>
          <FormattedMessage
            id="queryEnhancements.queryBar.pplSyntaxOptionsDescription"
            defaultMessage="Piped Processing Language ({pplDocsLink}) is a query language that focuses on processing data in a sequential, step-by-step manner. OpenSearch SQL/PPL language limitations can be found {limitationDocsLink}."
            values={{
              pplDocsLink: (
                <EuiLink href={pplDocs} target="_blank">
                  {pplFullName}
                </EuiLink>
              ),
              limitationDocsLink: (
                <EuiLink href={limitationDocs} target="_blank">
                  {limitationsLink}
                </EuiLink>
              ),
            }}
          />
        </p>
      </EuiText>
    </>
  );
};

export const pplLanguageReference = (selectedLanguage) => {
  const hasSeenInfoBox = localStorage.getItem('hasSeenInfoBox_PPL') === 'true';
  const shouldAutoShow = selectedLanguage === 'PPL' && !hasSeenInfoBox;

  return (
    <LanguageReference
      body={<PPLReference />}
      autoShow={shouldAutoShow}
      selectedLanguage={selectedLanguage}
    />
  );
};
