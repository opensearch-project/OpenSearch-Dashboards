/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { EuiToolTip, EuiButtonIcon, EuiPopover, EuiPopoverTitle } from '@elastic/eui';
import { selectQueryLanguage } from '../../../../application/utils/state_management/selectors';
import { PplReference } from './ppl_reference';
import './language_reference.scss';

export const LANGUAGE_REFERENCE_HANDLED_LANGUAGES = ['PPL'];

export const getLanguageReference = (language: string) => {
  switch (language) {
    case 'PPL':
      return <PplReference />;
    default:
      return null;
  }
};

export const LanguageReference = () => {
  const language = useSelector(selectQueryLanguage);
  const storageKey = `hasSeenInfoBox_${language}`;
  const [popoverIsOpen, setPopoverIsOpen] = useState(localStorage.getItem(storageKey) !== 'true');
  const languageIsHandled = LANGUAGE_REFERENCE_HANDLED_LANGUAGES.includes(language);

  useEffect(() => {
    if (popoverIsOpen) {
      window.localStorage.setItem(storageKey, 'true');
    }
  }, [storageKey, popoverIsOpen]);

  return (
    <EuiPopover
      id="languageReferencePopover"
      button={
        <EuiToolTip
          position="left"
          content={
            languageIsHandled
              ? i18n.translate('explore.queryPanel.languageReference.handledTooltip', {
                  defaultMessage: 'Language reference for {language}',
                  values: {
                    language,
                  },
                })
              : i18n.translate('explore.queryPanel.languageReference.unhandledTooltip', {
                  defaultMessage: 'Language reference unavailable for {language}',
                  values: {
                    language,
                  },
                })
          }
        >
          <EuiButtonIcon
            aria-label="language reference"
            size="xs"
            className={classNames('exploreLanguageReference', {
              ['exploreLanguageReference--disabled']: !languageIsHandled,
            })}
            data-test-subj="exploreLanguageReference"
            disabled={!languageIsHandled}
            iconType="iInCircle"
            onClick={() => setPopoverIsOpen((value) => !value)}
          />
        </EuiToolTip>
      }
      isOpen={popoverIsOpen}
      closePopover={() => setPopoverIsOpen(false)}
      panelPaddingSize="s"
      anchorPosition="leftDown"
    >
      <EuiPopoverTitle>
        <FormattedMessage
          id="explore.queryPanel.selectedLanguage.syntaxOptionsTitle"
          defaultMessage="Syntax options"
        />
      </EuiPopoverTitle>
      <div className="exploreLanguageReference__popoverBody">{getLanguageReference(language)}</div>
    </EuiPopover>
  );
};
