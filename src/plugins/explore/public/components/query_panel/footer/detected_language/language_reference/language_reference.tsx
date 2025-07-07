/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectQueryLanguage } from '../../../../../application/utils/state_management/selectors';
import { PplReference } from './ppl_reference';
import { LanguageReference as DataLanguageReference } from '../../../../../../../data/public';

export const LanguageReference = () => {
  const language = useSelector(selectQueryLanguage);

  const body = useMemo(() => {
    switch (language) {
      case 'PPL':
        return <PplReference />;
      default:
        throw new Error(`LanguageReference encountered an unhandled language: ${language}`);
    }
  }, [language]);

  return (
    <>
      {language}{' '}
      <DataLanguageReference
        body={body}
        selectedLanguage={language}
        autoShow={localStorage.getItem(`hasSeenInfoBox_${language}`) !== 'true'}
      />
    </>
  );
};
