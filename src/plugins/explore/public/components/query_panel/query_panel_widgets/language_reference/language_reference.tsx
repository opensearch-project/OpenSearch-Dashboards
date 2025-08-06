/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { EuiButtonIcon, EuiPopover, EuiPopoverTitle } from '@elastic/eui';
import { selectQueryLanguage } from '../../../../application/utils/state_management/selectors';
import { PplReference } from './ppl_reference';
import './language_reference.scss';

export const getLanguageReference = (language: string) => {
  switch (language) {
    case 'PPL':
      return <PplReference />;
    default:
      throw new Error(`LanguageReference encountered an unhandled language: ${language}`);
  }
};

export const LanguageReference = () => {
  const language = useSelector(selectQueryLanguage);
  const storageKey = `hasSeenInfoBox_${language}`;
  const [popoverIsOpen, setPopoverIsOpen] = useState(localStorage.getItem(storageKey) !== 'true');

  useEffect(() => {
    if (popoverIsOpen) {
      window.localStorage.setItem(storageKey, 'true');
    }
  }, [storageKey, popoverIsOpen]);

  return (
    <EuiPopover
      id="languageReferencePopover"
      button={
        <EuiButtonIcon
          size="xs"
          className="exploreLanguageReference"
          data-test-subj="exploreLanguageReference"
          iconType="iInCircle"
          onClick={() => setPopoverIsOpen((value) => !value)}
        />
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
