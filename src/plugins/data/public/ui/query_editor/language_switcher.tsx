/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiComboBox, EuiComboBoxOptionOption, PopoverAnchorPosition } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { getSearchService, getUiService } from '../../services';

interface Props {
  language: string;
  onSelectLanguage: (newLanguage: string) => void;
  anchorPosition?: PopoverAnchorPosition;
  appName?: string;
}

function mapExternalLanguageToOptions(language: string) {
  return {
    label: language,
    value: language,
  };
}

export function QueryLanguageSwitcher(props: Props) {
  const dqlLabel = i18n.translate('data.query.queryBar.dqlLanguageName', {
    defaultMessage: 'DQL',
  });
  const luceneLabel = i18n.translate('data.query.queryBar.luceneLanguageName', {
    defaultMessage: 'Lucene',
  });

  const languageOptions: EuiComboBoxOptionOption[] = [
    {
      label: dqlLabel,
      value: 'kuery',
    },
    {
      label: luceneLabel,
      value: 'lucene',
    },
  ];

  const uiService = getUiService();
  const searchService = getSearchService();

  const queryEnhancements = uiService.queryEnhancements;
  if (uiService.isEnhancementsEnabled) {
    queryEnhancements.forEach((enhancement) => {
      if (
        enhancement.supportedAppNames &&
        props.appName &&
        !enhancement.supportedAppNames.includes(props.appName)
      )
        return;
      languageOptions.push(mapExternalLanguageToOptions(enhancement.language));
    });
  }

  const selectedLanguage = {
    label:
      (languageOptions.find(
        (option) => (option.value as string).toLowerCase() === props.language.toLowerCase()
      )?.label as string) ?? languageOptions[0].label,
  };

  const setSearchEnhance = (queryLanguage: string) => {
    if (!uiService.isEnhancementsEnabled) return;
    const queryEnhancement = queryEnhancements.get(queryLanguage);
    searchService.__enhance({
      searchInterceptor: queryEnhancement
        ? queryEnhancement.search
        : searchService.getDefaultSearchInterceptor(),
    });

    if (!queryEnhancement) {
      searchService.df.clear();
    }
    uiService.Settings.setUiOverridesByUserQueryLanguage(queryLanguage);
  };

  const handleLanguageChange = (newLanguage: EuiComboBoxOptionOption[]) => {
    const queryLanguage = newLanguage[0].value as string;
    props.onSelectLanguage(queryLanguage);
    setSearchEnhance(queryLanguage);
  };

  setSearchEnhance(props.language);

  return (
    <EuiComboBox
      className="languageSelect"
      data-test-subj="languageSelect"
      options={languageOptions}
      selectedOptions={[selectedLanguage]}
      onChange={handleLanguageChange}
      singleSelection={{ asPlainText: true }}
      isClearable={false}
      async
    />
  );
}
