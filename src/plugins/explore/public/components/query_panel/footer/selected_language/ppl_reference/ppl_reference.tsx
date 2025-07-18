/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { EuiLink, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../../types';

const limitationText = i18n.translate('explore.queryPanel.languageReference.pplLimitation', {
  defaultMessage: 'here',
});

export const PplReference = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const pplDocs = services.docLinks.links.noDocumentation.ppl.base;
  const limitationDocs = services.docLinks.links.noDocumentation.sqlPplLimitation.base;

  return (
    <EuiText size="s">
      <p>
        <FormattedMessage
          id="explore.queryPanel.languageReference.pplReference"
          defaultMessage="Piped Processing Language ({pplDocsLink}) is a query language that focuses on processing data in a sequential, step-by-step manner. OpenSearch SQL/PPL language limitations can be found {limitationDocsLink}."
          values={{
            pplDocsLink: (
              <EuiLink href={pplDocs} target="_blank">
                PPL
              </EuiLink>
            ),
            limitationDocsLink: (
              <EuiLink href={limitationDocs} target="_blank">
                {limitationText}
              </EuiLink>
            ),
          }}
        />
      </p>
    </EuiText>
  );
};
