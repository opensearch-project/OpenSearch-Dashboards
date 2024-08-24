/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PopoverAnchorPosition,
  EuiContextMenuPanel,
  EuiPopover,
  EuiButtonEmpty,
  EuiContextMenuItem,
} from '@elastic/eui';
import { getQueryService, getUiService } from '../../services';
import { LanguageConfig } from '../../query';
import { Query } from '../..';

export interface QueryLanguageSelectorProps {
  query: Query;
  onSelectLanguage: (newLanguage: string) => void;
  anchorPosition?: PopoverAnchorPosition;
  appName?: string;
}

const mapExternalLanguageToOptions = (language: LanguageConfig) => {
  return {
    label: language.title,
    value: language.id,
  };
};

export const QueryLanguageSelector = (props: QueryLanguageSelectorProps) => {
  const [isPopoverOpen, setPopover] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(props.query.language);

  const uiService = getUiService();
  const queryService = getQueryService();

  useEffect(() => {
    const subscription = queryService.queryString.getUpdates$().subscribe((query: Query) => {
      if (query.language !== currentLanguage) {
        setCurrentLanguage(query.language);
        props.onSelectLanguage(query.language);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryService, currentLanguage, props.onSelectLanguage, props]);

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const languageOptions: Array<{ label: string; value: string }> = [];

  const languages = queryService.queryString.getLanguages();
  languages.forEach((languageId) => {
    const language = queryService.queryString.getLanguage(languageId);
    if (
      (language && props.appName && !language.supportedAppNames.includes(props.appName)) ||
      uiService.Settings.getUserQueryLanguageBlocklist().includes(language?.id)
    )
      return;
    languageOptions.unshift(mapExternalLanguageToOptions(language!));
  });

  const selectedLanguage = {
    label:
      (languageOptions.find(
        (option) => (option.value as string).toLowerCase() === currentLanguage.toLowerCase()
      )?.label as string) ?? languageOptions[0].label,
  };

  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    props.onSelectLanguage(newLanguage);
    uiService.Settings.setUserQueryLanguage(newLanguage);

    // Update the query in the QueryStringManager
    const currentQuery = queryService.queryString.getQuery();
    const input = queryService.queryString.getLanguage(newLanguage)?.searchBar?.queryStringInput
      ?.initialValue;

    if (!input) return '';
    const newQuery = input?.replace(
      '<data_source>',
      currentQuery.dataset?.title ?? currentQuery.dataset?.title ?? ''
    );

    queryService.queryString.setQuery({
      query: newQuery,
      language: newLanguage,
      dataset: currentQuery.dataset,
    });
  };

  uiService.Settings.setUserQueryLanguage(currentLanguage);

  const languageOptionsMenu = languageOptions
    .sort((a, b) => {
      return a.label.localeCompare(b.label);
    })
    .map((language) => {
      return (
        <EuiContextMenuItem
          key={language.label}
          className="languageSelector__menuItem"
          icon={language.label === selectedLanguage.label ? 'check' : 'empty'}
          onClick={() => {
            setPopover(false);
            handleLanguageChange(language.value);
          }}
        >
          {language.label}
        </EuiContextMenuItem>
      );
    });

  return (
    <EuiPopover
      className="languageSelector"
      button={
        <EuiButtonEmpty
          iconSide="right"
          iconSize="s"
          onClick={onButtonClick}
          className="languageSelector__button"
          iconType={'arrowDown'}
        >
          {selectedLanguage.label}
        </EuiButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={() => setPopover(false)}
      panelPaddingSize="none"
      anchorPosition={props.anchorPosition ?? 'downLeft'}
    >
      <EuiContextMenuPanel
        initialFocusedItemIndex={languageOptions.findIndex(
          (option) => option.label === selectedLanguage.label
        )}
        size="s"
        items={languageOptionsMenu}
      />
    </EuiPopover>
  );
};

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default QueryLanguageSelector;
