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
import { getQueryService } from '../../services';
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

  const queryString = getQueryService().queryString;
  const languageService = queryString.getLanguageService();

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
      languageService.getUserQueryLanguageBlocklist().includes(language?.id)
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
