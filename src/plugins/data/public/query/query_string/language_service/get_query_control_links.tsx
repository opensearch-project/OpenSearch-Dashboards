/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPopoverTitle,
  EuiText,
  EuiWrappingPopover,
} from '@elastic/eui';
import ReactDOM from 'react-dom';
import { FormattedMessage } from 'react-intl';
import {
  OpenSearchDashboardsContextProvider,
  toMountPoint,
} from '../../../../../opensearch_dashboards_react/public';
import { IDataPluginServices } from '../../../types';
import { PPLReferenceFlyout } from './ppl_reference_flyout';

export interface QueryControl {
  id: string;
  label: string;
  testId: string;
  ariaLabel: string;
  run: (anchorElement: HTMLElement) => void;
  iconType: string;
}

export const QueryControls = (props: {
  services: IDataPluginServices;
  queryLanguage: string;
  onToggleCollapse: () => void;
  savedQueryManagement?: any;
  additionalControls?: QueryControl[];
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isLanguageReferenceOpen, setIsLanguageReferenceOpen] = useState<boolean>(false);

  const languageReferenceContainer = document.createElement('div');

  const onCloseLanguageReference = () => {
    ReactDOM.unmountComponentAtNode(languageReferenceContainer);
    setIsLanguageReferenceOpen(false);
  };

  const osdDQLDocs = 'https://opensearch.org/docs/2.16/dashboards/dql)';
  const dqlFullName = (
    <FormattedMessage
      id="data.query.queryBar.dqlFullLanguageName"
      defaultMessage="OpenSearch Dashboards Query Language"
    />
  );

  const languageReference: QueryControl = {
    id: 'languageReference',
    label: i18n.translate('discover.queryControls.languageReference', {
      defaultMessage: 'Open',
    }),
    testId: 'languageReference',
    ariaLabel: i18n.translate('discover.queryControls.languageReference', {
      defaultMessage: `Language Reference`,
    }),
    run: async (anchorElement) => {
      if (props.queryLanguage === 'PPL' || props.queryLanguage === 'SQL') {
        const flyoutSession = props.services.overlays!.openFlyout(
          toMountPoint(
            <OpenSearchDashboardsContextProvider services={props.services}>
              <PPLReferenceFlyout
                onClose={() => flyoutSession?.close?.().then()}
                makeUrl={(searchId: any) => `#/view/${encodeURIComponent(searchId)}`}
              />
            </OpenSearchDashboardsContextProvider>
          )
        );
      } else {
        if (isLanguageReferenceOpen) {
          onCloseLanguageReference();
          return;
        }

        setIsLanguageReferenceOpen(true);
        document.body.appendChild(languageReferenceContainer);

        const element = (
          <EuiWrappingPopover
            id="languageReferencePopover"
            button={anchorElement}
            isOpen={true}
            closePopover={onCloseLanguageReference}
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
                    defaultMessage="The {docsLink} (DQL) offers a simplified query
              syntax and support for scripted fields."
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
          </EuiWrappingPopover>
        );

        ReactDOM.render(element, languageReferenceContainer);
      }
    },
    iconType: 'iInCircle',
  };

  const languageToggle: QueryControl = {
    id: 'languageToggle',
    label: i18n.translate('discover.queryControls.languageToggle', {
      defaultMessage: 'Toggle',
    }),
    testId: 'languageToggle',
    ariaLabel: i18n.translate('discover.queryControls.languageToggle', {
      defaultMessage: `Language Toggle`,
    }),
    run: () => {
      setIsCollapsed(!isCollapsed);
      props.onToggleCollapse();
    },
    iconType: isCollapsed ? 'expand' : 'minimize',
  };

  const queryControls =
    props.queryLanguage === 'PPL' || props.queryLanguage === 'SQL'
      ? [languageReference, languageToggle]
      : [languageReference];

  if (props.additionalControls) {
    queryControls.push(...props.additionalControls);
  }

  return (
    <EuiFlexGroup responsive={false} gutterSize="s" alignItems="center">
      {queryControls.map((queryControl) => (
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType={queryControl.iconType}
            aria-label={queryControl.ariaLabel}
            onClick={(event) => queryControl.run(event.currentTarget)}
          />
        </EuiFlexItem>
      ))}
      {props.savedQueryManagement}
    </EuiFlexGroup>
  );
};
