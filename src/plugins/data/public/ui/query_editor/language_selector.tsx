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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isEqual } from 'lodash';
import { LanguageConfig } from '../../query';
import { getQueryService } from '../../services';

export interface QueryLanguageSelectorProps {
  onSelectLanguage: (newLanguage: string) => void;
  anchorPosition?: PopoverAnchorPosition;
  appName?: string;
}

interface LanguageOption {
  label: string;
  value: string;
}

const mapExternalLanguageToOptions = (language: LanguageConfig): LanguageOption => {
  return {
    label: language.title,
    value: language.id,
  };
};

export const QueryLanguageSelector = (props: QueryLanguageSelectorProps) => {
  const queryString = getQueryService().queryString;
  const languageService = queryString.getLanguageService();

  const [isPopoverOpen, setPopover] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    queryString.getQuery()?.language || languageService.getDefaultLanguage()?.id || ''
  );
  const [languageOptions, setLanguageOptions] = useState<LanguageOption[]>([]);

  useEffect(() => {
    const updateState = () => {
      const query = queryString.getQuery();
      const language = query.language || languageService.getDefaultLanguage()?.id;
      const dataset = query.dataset;

      // Update current language if changed
      if (language !== currentLanguage) {
        setCurrentLanguage(language || '');
      }

      // Get supported languages
      const languages = !dataset
        ? languageService.getLanguages().map((l) => l.id)
        : queryString.getDatasetService().getType(dataset.type)?.supportedLanguages(dataset) ??
          null;

      if (!languages) {
        return;
      }

      // Build new options including app support check
      const newOptions = languageService
        .getLanguages()
        .filter(
          (lang) =>
            languages.includes(lang.id) &&
            (!props.appName || lang.editorSupportedAppNames?.includes(props.appName))
        )
        .map(mapExternalLanguageToOptions)
        .sort((a, b) => a.label.localeCompare(b.label));

      if (!isEqual(newOptions, languageOptions)) {
        setLanguageOptions(newOptions);
      }
    };

    updateState();

    const subscription = queryString.getUpdates$().subscribe(() => {
      updateState();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentLanguage, languageOptions, languageService, queryString, props.appName]);

  const selectedLanguage = useMemo(
    () => ({
      label:
        languageOptions.find(
          (option) => option.value.toLowerCase() === currentLanguage.toLowerCase()
        )?.label ?? languageOptions[0]?.label,
    }),
    [languageOptions, currentLanguage]
  );

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      setCurrentLanguage(newLanguage);
      props.onSelectLanguage(newLanguage);
      languageService.setUserQueryLanguage(newLanguage);
      setPopover(false);
    },
    [props, languageService]
  );

  const languageOptionsMenu = useMemo(
    () =>
      languageOptions.map((language) => (
        <EuiContextMenuItem
          key={language.label}
          className="languageSelector__menuItem"
          data-test-subj="languageSelectorMenuItem"
          icon={language.label === selectedLanguage.label ? 'check' : 'empty'}
          onClick={() => handleLanguageChange(language.value)}
        >
          {language.label}
        </EuiContextMenuItem>
      )),
    [languageOptions, selectedLanguage.label, handleLanguageChange]
  );

  return (
    <EuiPopover
      className="languageSelector"
      button={
        <EuiSmallButtonEmpty
          iconSide="right"
          onClick={() => setPopover(!isPopoverOpen)}
          className="languageSelector__button"
          iconType="arrowDown"
          data-test-subj="queryEditorLanguageSelector"
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
        data-test-subj="queryEditorLanguageOptions"
      />
    </EuiPopover>
  );
};

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default QueryLanguageSelector;
