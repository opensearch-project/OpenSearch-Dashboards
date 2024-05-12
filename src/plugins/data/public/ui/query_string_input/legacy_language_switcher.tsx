/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiForm,
  EuiFormRow,
  EuiLink,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  PopoverAnchorPosition,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useState } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

interface Props {
  language: string;
  onSelectLanguage: (newLanguage: string) => void;
  anchorPosition?: PopoverAnchorPosition;
}

export function LegacyQueryLanguageSwitcher(props: Props) {
  const osdDQLDocs = useOpenSearchDashboards().services.docLinks?.links.opensearchDashboards.dql
    .base;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const luceneLabel = (
    <FormattedMessage id="data.query.queryBar.luceneLanguageName" defaultMessage="Lucene" />
  );
  const dqlLabel = (
    <FormattedMessage id="data.query.queryBar.dqlLanguageName" defaultMessage="DQL" />
  );
  const dqlFullName = (
    <FormattedMessage
      id="data.query.queryBar.dqlFullLanguageName"
      defaultMessage="OpenSearch Dashboards Query Language"
    />
  );

  const button = (
    <EuiButtonEmpty
      size="xs"
      onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      className="euiFormControlLayout__append dqlQueryBar__languageSwitcherButton"
      data-test-subj={'switchQueryLanguageButton'}
    >
      {props.language === 'lucene' ? luceneLabel : dqlLabel}
    </EuiButtonEmpty>
  );

  return (
    <EuiPopover
      id="queryLanguageSwitcherPopover"
      anchorClassName="euiFormControlLayout__append"
      ownFocus
      anchorPosition={props.anchorPosition || 'downRight'}
      button={button}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      repositionOnScroll
    >
      <EuiPopoverTitle>
        <FormattedMessage
          id="data.query.queryBar.syntaxOptionsTitle"
          defaultMessage="Syntax options"
        />
      </EuiPopoverTitle>
      <div style={{ width: '350px' }}>
        <EuiText>
          <p>
            <FormattedMessage
              id="data.query.queryBar.syntaxOptionsDescription"
              defaultMessage="The {docsLink} (DQL) offers a simplified query
              syntax and support for scripted fields. If you turn off DQL,
              OpenSearch Dashboards uses Lucene."
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

        <EuiSpacer size="m" />

        <EuiForm>
          <EuiFormRow label={dqlFullName}>
            <EuiSwitch
              id="queryEnhancementOptIn"
              name="popswitch"
              label={
                props.language === 'kuery' ? (
                  <FormattedMessage id="data.query.queryBar.dqlOnLabel" defaultMessage="On" />
                ) : (
                  <FormattedMessage id="data.query.queryBar.dqlOffLabel" defaultMessage="Off" />
                )
              }
              checked={props.language === 'kuery'}
              onChange={() => {
                const newLanguage = props.language === 'lucene' ? 'kuery' : 'lucene';
                props.onSelectLanguage(newLanguage);
              }}
              data-test-subj="languageToggle"
            />
          </EuiFormRow>
        </EuiForm>
      </div>
    </EuiPopover>
  );
}
