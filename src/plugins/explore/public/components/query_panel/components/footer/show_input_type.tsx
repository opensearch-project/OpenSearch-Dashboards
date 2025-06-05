/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { LanguageType } from '../../types';

interface ShowInputTypeProps {
  languageType: LanguageType; // Added the missing property
  isDualEditor: boolean;
  noInput: boolean;
}

export const ShowInputType: React.FC<ShowInputTypeProps> = ({
  languageType,
  isDualEditor,
  noInput,
}) => {
  // Memoized function to determine the display text
  const getDisplayText = useMemo(() => {
    if (noInput) return '';
    if (languageType === LanguageType.Natural) {
      return isDualEditor ? 'Natural Language | PPL' : 'Natural Language';
    }
    return LanguageType.PPL.toUpperCase(); // Default to empty for other language types
  }, [languageType, isDualEditor, noInput]);

  return getDisplayText ? <span className="showInputType">{getDisplayText} </span> : null;
};
