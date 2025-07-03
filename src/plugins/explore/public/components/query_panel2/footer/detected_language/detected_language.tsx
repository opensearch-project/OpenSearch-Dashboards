/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { selectEditorMode } from '../../../../application/utils/state_management/selectors';
import './detected_language.scss';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { LanguageReference } from './language_reference';

const naturalLanguageText = i18n.translate('explore.queryPanel.detectedLanguage.naturalLabel', {
  defaultMessage: 'Natural Language',
});

export const DetectedLanguage = () => {
  const editorMode = useSelector(selectEditorMode);

  const content = useMemo(() => {
    switch (editorMode) {
      case EditorMode.DualQuery:
      case EditorMode.DualPrompt: {
        return (
          <>
            {`${naturalLanguageText} |`}
            <LanguageReference />
          </>
        );
      }
      case EditorMode.SinglePrompt:
        return naturalLanguageText;
      case EditorMode.SingleQuery:
        return <LanguageReference />;
      default:
        throw new Error(`DetectedLanguage encountered unsupported editorMode: ${editorMode}`);
    }
  }, [editorMode]);

  return (
    <span className="exploreDetectedLanguage" data-test-subj="exploreDetectedLanguage">
      {content}
    </span>
  );
};
