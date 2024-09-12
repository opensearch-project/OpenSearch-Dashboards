/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { EuiButtonIcon, EuiLink, EuiPopover, EuiPopoverTitle, EuiText } from '@elastic/eui';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { IDataPluginServices } from '../../../../types';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';

export const DefaultLanguageReference = () => {
  const opensearchDashboards = useOpenSearchDashboards<IDataPluginServices>();
  const [isLanguageReferenceOpen, setIsLanguageReferenceOpen] = React.useState(false);
  const osdDQLDocs = opensearchDashboards.services.docLinks?.links.opensearchDashboards.dql.base;
  const dqlFullName = (
    <FormattedMessage
      id="data.query.queryBar.dqlFullLanguageName"
      defaultMessage="OpenSearch Dashboards Query Language"
    />
  );

  const button = (
    <div>
      <EuiButtonIcon
        iconType={'iInCircle'}
        aria-label={i18n.translate('discover.queryControls.languageReference', {
          defaultMessage: `Language Reference`,
        })}
        onClick={() => setIsLanguageReferenceOpen(!isLanguageReferenceOpen)}
      />
    </div>
  );

  return (
    <EuiPopover
      id="languageReferencePopover"
      button={button}
      isOpen={isLanguageReferenceOpen}
      closePopover={() => setIsLanguageReferenceOpen(false)}
      panelPaddingSize="s"
      anchorPosition="downLeft"
      anchorClassName="euiFormControlLayout__append"
    >
      <EuiPopoverTitle>
        <FormattedMessage
          id="data.query.queryBar.syntaxOptionsTitle"
          defaultMessage="Syntax options"
        />
      </EuiPopoverTitle>
      <div style={{ width: '350px' }}>
        <EuiText size="s">
          <p>
            <FormattedMessage
              id="data.query.queryBar.syntaxOptionsDescription"
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
      </div>
    </EuiPopover>
  );
};

export const createDefaultLanguageReference = () => {
  return <DefaultLanguageReference />;
};
