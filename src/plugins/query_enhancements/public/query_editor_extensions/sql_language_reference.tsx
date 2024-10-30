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
  const limitationDocs =
    opensearchDashboards.services.docLinks?.links.noDocumentation.sqlPplLimitation.base;
  const sqlFullName = (
    <FormattedMessage id="queryEnhancements.queryBar.sqlFullLanguageName" defaultMessage="SQL" />
  );
  const limitationsLink = (
    <FormattedMessage id="queryEnhancements.queryBar.sqlLimitationDoc" defaultMessage="here" />
  );

  return (
    <>
      <EuiText size="s">
        <p>
          <FormattedMessage
            id="queryEnhancements.queryBar.sqlSyntaxOptionsDescription"
            defaultMessage="OpenSearch {sqlDocsLink}. OpenSearch SQL/PPL language limitations can be found {limitationDocsLink}."
            values={{
              sqlDocsLink: (
                <EuiLink href={sqlDocs} target="_blank">
                  {sqlFullName}
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

export const sqlLanguageReference = (selectedLanguage) => {
  const hasSeenInfoBox = localStorage.getItem('hasSeenInfoBox_SQL') === 'true';
  const shouldAutoShow = selectedLanguage === 'SQL' && !hasSeenInfoBox;

  return (
    <LanguageReference
      body={<SQLReference />}
      autoShow={shouldAutoShow}
      selectedLanguage={selectedLanguage}
    />
  );
};
