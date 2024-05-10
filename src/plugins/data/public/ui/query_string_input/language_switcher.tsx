/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
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
