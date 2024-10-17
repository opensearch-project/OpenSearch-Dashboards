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

const LuceneReference = () => {
  const opensearchDashboards = useOpenSearchDashboards<IDataPluginServices>();
  const luceneDocs = opensearchDashboards.services.docLinks?.links.noDocumentation.lucene.base;
  const luceneFullName = (
    <FormattedMessage id="data.query.queryBar.luceneFullLanguageName" defaultMessage="Lucene" />
  );

  return (
    <>
      <EuiText size="s">
        <p>
          <FormattedMessage
            id="data.query.queryBar.luceneSyntaxOptionsDescription"
            defaultMessage="{docsLink} is a query syntax that allows precise searching and filtering on indexed text."
            values={{
              docsLink: (
                <EuiLink href={luceneDocs} target="_blank">
                  {luceneFullName}
                </EuiLink>
              ),
            }}
          />
        </p>
      </EuiText>
    </>
  );
};

export const luceneLanguageReference = () => {
  return <LanguageReference body={<LuceneReference />} />;
};
