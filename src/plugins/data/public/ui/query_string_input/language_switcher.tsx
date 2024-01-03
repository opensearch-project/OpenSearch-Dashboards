/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  EuiButtonEmpty,
  EuiComboBox,
  EuiComboBoxOptionOption,
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
import { useObservable } from 'react-use';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IDataPluginServices } from '../../types';

interface Props {
  language: string;
  onSelectLanguage: (newLanguage: string) => void;
  anchorPosition?: PopoverAnchorPosition;
}

export function QueryLanguageSwitcher(props: Props) {
  const opensearchDashboards = useOpenSearchDashboards<IDataPluginServices>();
  const { application } = opensearchDashboards.services;
  const currentApp$ = application?.currentAppId$;
  let useNewQuerySelector;
  application?.applications$.subscribe((applications) => {
    applications.forEach((applicationEntry) => {
      if (applicationEntry.id === 'observability-dashboards') {
        useNewQuerySelector = true;
        return;
      }
    });
  });

  const dataExplorerOptions = [
    {
      label: 'DQL',
    },
    {
      label: 'lucene',
    },
    {
      label: 'PPL',
    },
    {
      label: 'SQL',
    },
  ];

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

  const handleLanguageChange = (newLanguage: EuiComboBoxOptionOption[]) => {
    if (['PPL', 'SQL'].includes(newLanguage[0].label)) {
      application?.navigateToUrl('../observability-logs#/explorer');
      return;
    }
    const queryLanguage = newLanguage[0].label === 'DQL' ? 'kuery' : newLanguage[0].label;
    props.onSelectLanguage(queryLanguage);
  };

  // The following is a temporary solution for adding PPL navigation, and should be replaced once final solution is determined.
  // Follow-up issue: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5628
  if (useObservable(currentApp$!, '') === 'data-explorer' && useNewQuerySelector) {
    const selectedLanguage = {
      label: props.language === 'kuery' ? 'DQL' : props.language,
    };
    return (
      <EuiComboBox
        className="languageSwitcher"
        data-test-subj="languageSelect"
        options={dataExplorerOptions}
        selectedOptions={[selectedLanguage]}
        onChange={handleLanguageChange}
        singleSelection={{ asPlainText: true }}
        isClearable={false}
        async
      />
    );
  } else {
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
}
