/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { LanguageType } from '../../types';

interface ShowInputTypeProps {
  languageType: LanguageType;
  isDualEditor: boolean;
  noInput: boolean;
}

export const ShowInputType: React.FC<ShowInputTypeProps> = ({
  languageType,
  isDualEditor,
  noInput,
}) => {
  const getDisplayText = useMemo(() => {
    if (noInput) return '';

    if (languageType === LanguageType.Natural) {
      return isDualEditor
        ? i18n.translate('explore.queryPanel.showInputType.naturalAndPPLLabel', {
            defaultMessage: 'Natural Language | PPL',
          })
        : i18n.translate('explore.queryPanel.showInputType.naturalLabel', {
            defaultMessage: 'Natural Language',
          });
    }

    return i18n.translate('explore.queryPanel.showInputType.pplLabel', {
      defaultMessage: 'PPL',
    });
  }, [languageType, isDualEditor, noInput]);

  return getDisplayText ? (
    <span
      className="queryPanel__footer__showInputType"
      data-test-subj="queryPanelFooterShowInputType"
    >
      {getDisplayText}{' '}
    </span>
  ) : null;
};
