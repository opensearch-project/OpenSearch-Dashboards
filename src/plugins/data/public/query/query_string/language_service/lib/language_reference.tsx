/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { EuiButtonIcon, EuiPopover, EuiPopoverTitle } from '@elastic/eui';

import React, { ReactFragment, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

export const LanguageReference = (props: {
  body: ReactFragment;
  autoShow?: boolean;
  selectedLanguage?: string;
}) => {
  const [isLanguageReferenceOpen, setIsLanguageReferenceOpen] = useState(props.autoShow || false);

  // useEffect hook to auto-open the info box on the first selection of SQL or PPL
  useEffect(() => {
    if (
      props.selectedLanguage === 'SQL' &&
      window.localStorage.getItem('hasSeenSQLInfoBox') === 'false'
    ) {
      setIsLanguageReferenceOpen(true);
      window.localStorage.setItem('hasSeenSQLInfoBox', 'true');
    } else if (
      props.selectedLanguage === 'PPL' &&
      window.localStorage.getItem('hasSeenPPLInfoBox') === 'false'
    ) {
      setIsLanguageReferenceOpen(true);
      window.localStorage.setItem('hasSeenPPLInfoBox', 'true');
    }
  }, [props.selectedLanguage]);

  const button = (
    <div>
      <EuiButtonIcon
        iconType={'iInCircle'}
        aria-label={i18n.translate('data.queryControls.languageReference', {
          defaultMessage: `Language Reference`,
        })}
        onClick={() => setIsLanguageReferenceOpen(!isLanguageReferenceOpen)}
        data-test-subj="languageReferenceButton"
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
      <div style={{ width: '350px' }}>{props.body}</div>
    </EuiPopover>
  );
};
