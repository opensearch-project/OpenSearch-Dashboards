/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { EuiButtonEmpty, EuiIcon, EuiPopover, EuiPopoverTitle, EuiText } from '@elastic/eui';
import {
  selectEditorMode,
  selectPromptModeIsAvailable,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { PplReference } from './ppl_reference';
import './detected_language.scss';

const naturalLanguageText = i18n.translate('explore.queryPanel.detectedLanguage.naturalLabel', {
  defaultMessage: 'Natural Language',
});

export const getLanguageReference = (language: string) => {
  switch (language) {
    case 'PPL':
      return <PplReference />;
    default:
      throw new Error(`LanguageReference encountered an unhandled language: ${language}`);
  }
};

export const DetectedLanguage = () => {
  const editorMode = useSelector(selectEditorMode);
  const promptModeIsAvailable = useSelector(selectPromptModeIsAvailable);
  const language = useSelector(selectQueryLanguage);
  const storageKey = `hasSeenInfoBox_${language}`;
  const [popoverIsOpen, setPopoverIsOpen] = useState(localStorage.getItem(storageKey) !== 'true');
  const buttonIsEnabled = editorMode !== EditorMode.SinglePrompt;

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
      case EditorMode.SingleEmpty:
      case EditorMode.DualQuery:
      case EditorMode.DualPrompt: {
        return `${naturalLanguageText}/${language}`;
      }
      case EditorMode.SinglePrompt:
        return naturalLanguageText;
      case EditorMode.SingleQuery:
        return language;
      default:
        throw new Error(`DetectedLanguage encountered unsupported editorMode: ${editorMode}`);
    }
  }, [editorMode, promptModeIsAvailable, language]);

  return (
    <EuiPopover
      id="languageReferencePopover"
      button={
        <EuiButtonEmpty
          disabled={!buttonIsEnabled}
          size="xs"
          className="exploreDetectedLanguage"
          data-test-subj="exploreDetectedLanguage"
          onClick={() => setPopoverIsOpen((value) => !value)}
        >
          <div className="exploreDetectedLanguage__buttonTextWrapper">
            <EuiText size="xs">{textContent}</EuiText>
            <EuiIcon type="iInCircle" size="s" />
          </div>
        </EuiButtonEmpty>
      }
      isOpen={popoverIsOpen}
      closePopover={() => setPopoverIsOpen(false)}
      panelPaddingSize="s"
      anchorPosition="downCenter"
    >
      <EuiPopoverTitle>
        <FormattedMessage
          id="explore.queryPanel.detecteLanguage.syntaxOptionsTitle"
          defaultMessage="Syntax options"
        />
      </EuiPopoverTitle>
      <div className="exploreDetectedLanguage__popoverBody">{getLanguageReference(language)}</div>
    </EuiPopover>
  );
};
