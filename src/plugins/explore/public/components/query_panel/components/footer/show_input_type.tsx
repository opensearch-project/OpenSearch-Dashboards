/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { LanguageType } from '../editor_stack/shared';

interface ShowInputTypeProps {
  languageType: LanguageType; // Added the missing property
  isDualEditor: Boolean;
  noInput: boolean;
}

export const ShowInputType: React.FC<ShowInputTypeProps> = ({
  languageType,
  isDualEditor,
  noInput,
}) => {
  console.log(noInput, 'noInput');
  // Memoized function to determine the display text
  const getDisplayText = useMemo(() => {
    if (noInput) return '';
    if (languageType === 'nl') {
      return isDualEditor ? 'Natural Language | PPL' : 'Natural Language';
    }
    return ''; // Default to empty for other language types
  }, [languageType, isDualEditor, noInput]);

  return getDisplayText ? <span className="show-input-type">{getDisplayText} </span> : null;
};
