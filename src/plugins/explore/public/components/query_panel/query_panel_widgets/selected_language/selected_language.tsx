/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { EuiButtonEmpty, EuiPopover, EuiPopoverTitle, EuiText } from '@elastic/eui';
import {
  selectEditorMode,
  selectIsPromptEditorMode,
  selectPromptModeIsAvailable,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { PplReference } from './ppl_reference';
import './selected_language.scss';

const naturalLanguageText = i18n.translate('explore.queryPanel.selectedLanguage.naturalLabel', {
  defaultMessage: 'Ask AI',
});

export const getLanguageReference = (language: string) => {
  switch (language) {
    case 'PPL':
      return <PplReference />;
    default:
      throw new Error(`LanguageReference encountered an unhandled language: ${language}`);
  }
};

export const SelectedLanguage = () => {
  const editorMode = useSelector(selectEditorMode);
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);
  const language = useSelector(selectQueryLanguage);
  const storageKey = `hasSeenInfoBox_${language}`;
  const [popoverIsOpen, setPopoverIsOpen] = useState(localStorage.getItem(storageKey) !== 'true');
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const buttonIsEnabled = !isPromptMode;

  useEffect(() => {
    if (popoverIsOpen) {
      window.localStorage.setItem(storageKey, 'true');
    }
  }, [storageKey, popoverIsOpen]);

  const textContent = useMemo(() => {
    if (!promptModeIsAvailable) {
      return language;
    }

    switch (editorMode) {
      case EditorMode.Query: {
        return language;
      }
      case EditorMode.Prompt:
        return naturalLanguageText;
      default:
        throw new Error(`SelectedLanguage encountered unsupported editorMode: ${editorMode}`);
    }
  }, [editorMode, promptModeIsAvailable, language]);

  return (
    <EuiPopover
      id="languageReferencePopover"
      button={
        <EuiButtonEmpty
          disabled={!buttonIsEnabled}
          size="xs"
          className="exploreSelectedLanguage"
          data-test-subj="exploreSelectedLanguage"
          onClick={() => setPopoverIsOpen((value) => !value)}
        >
          <EuiText size="xs">{textContent}</EuiText>
        </EuiButtonEmpty>
      }
      isOpen={popoverIsOpen}
      closePopover={() => setPopoverIsOpen(false)}
      panelPaddingSize="s"
      anchorPosition="downCenter"
    >
      <EuiPopoverTitle>
        <FormattedMessage
          id="explore.queryPanel.selectedLanguage.syntaxOptionsTitle"
          defaultMessage="Syntax options"
        />
      </EuiPopoverTitle>
      <div className="exploreSelectedLanguage__popoverBody">{getLanguageReference(language)}</div>
    </EuiPopover>
  );
};
