/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiPopover,
  EuiSmallButtonEmpty,
  PopoverAnchorPosition,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { Query } from '../..';
import { LanguageConfig } from '../../query';
import { getQueryService } from '../../services';

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

  const queryString = getQueryService().queryString;
  const languageService = queryString.getLanguageService();

  const datasetSupportedLanguages = props.query.dataset
    ? queryString
        .getDatasetService()
        .getType(props.query.dataset.type)
        ?.supportedLanguages(props.query.dataset)
    : undefined;

  useEffect(() => {
    const subscription = queryString.getUpdates$().subscribe((query: Query) => {
      if (query.language !== currentLanguage) {
        setCurrentLanguage(query.language);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryString, currentLanguage, props]);

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const languageOptions: Array<{ label: string; value: string }> = [];

  languageService.getLanguages().forEach((language) => {
    if (
      (language && props.appName && !language.editorSupportedAppNames?.includes(props.appName)) ||
      languageService.getUserQueryLanguageBlocklist().includes(language?.id) ||
      (datasetSupportedLanguages && !datasetSupportedLanguages.includes(language.id))
    )
      return;
    languageOptions.unshift(mapExternalLanguageToOptions(language));
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
  };

  languageService.setUserQueryLanguage(currentLanguage);

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
        <EuiSmallButtonEmpty
          iconSide="right"
          onClick={onButtonClick}
          className="languageSelector__button"
          iconType="arrowDown"
        >
          {selectedLanguage.label}
        </EuiSmallButtonEmpty>
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
