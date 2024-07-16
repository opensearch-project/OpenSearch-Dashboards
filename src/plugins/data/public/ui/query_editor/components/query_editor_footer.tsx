/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiComboBox, EuiComboBoxOptionOption, PopoverAnchorPosition } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { getUiService } from '../../services';

interface Props {
  language: string;
  onSelectLanguage: (newLanguage: string) => void;
  anchorPosition?: PopoverAnchorPosition;
  appName?: string;
}

const mapExternalLanguageToOptions = (language: string) => {
  return {
    label: language,
    value: language,
  };
};

// footer container ref: language selector, line count, timestamp fields,
// errors, feedbacks(ref from query enhancement plugin), shortcuts
// all the above are registerable by language
export const QueryEditorFooter = (props: Props) => {
  const dqlLabel = i18n.translate('data.query.queryEditor.dqlLanguageName', {
    defaultMessage: 'DQL',
  });
  const luceneLabel = i18n.translate('data.query.queryEditor.luceneLanguageName', {
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

  const queryEnhancements = uiService.Settings.getAllQueryEnhancements();
  queryEnhancements.forEach((enhancement) => {
    if (
      (enhancement.supportedAppNames &&
        props.appName &&
        !enhancement.supportedAppNames.includes(props.appName)) ||
      uiService.Settings.getUserQueryLanguageBlocklist().includes(
        enhancement.language.toLowerCase()
      )
    )
      return;
    languageOptions.unshift(mapExternalLanguageToOptions(enhancement.language));
  });

  const selectedLanguage = {
    label:
      (languageOptions.find(
        (option) => (option.value as string).toLowerCase() === props.language.toLowerCase()
      )?.label as string) ?? languageOptions[0].label,
  };

  const handleLanguageChange = (newLanguage: EuiComboBoxOptionOption[]) => {
    const queryLanguage = newLanguage[0].value as string;
    props.onSelectLanguage(queryLanguage);
    uiService.Settings.setUserQueryLanguage(queryLanguage);
  };

  uiService.Settings.setUserQueryLanguage(props.language);

  return (
    <div>
      <EuiComboBox
        fullWidth
        className="languageSelector"
        data-test-subj="languageSelector"
        options={languageOptions}
        selectedOptions={[selectedLanguage]}
        onChange={handleLanguageChange}
        singleSelection={{ asPlainText: true }}
        isClearable={false}
        async
      />
    </div>
  );
};
