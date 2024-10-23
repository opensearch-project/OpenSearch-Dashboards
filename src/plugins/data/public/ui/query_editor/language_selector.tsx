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

  const datasetSupportedLanguages = useMemo(() => {
    const dataset = props.query.dataset;
    if (!dataset) {
      return undefined;
    }
    const datasetType = queryString.getDatasetService().getType(dataset.type);
    return datasetType?.supportedLanguages(dataset);
  }, [props.query.dataset, queryString]);

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

  const languageOptions = useMemo(() => {
    const options: Array<{ label: string; value: string }> = [];

    languageService.getLanguages().forEach((language) => {
      const isSupported =
        !datasetSupportedLanguages || datasetSupportedLanguages.includes(language.id);
      const isBlocklisted = languageService.getUserQueryLanguageBlocklist().includes(language?.id);
      const isAppSupported =
        !props.appName || language?.editorSupportedAppNames?.includes(props.appName);

      if (!isSupported || isBlocklisted || !isAppSupported) return;

      options.unshift(mapExternalLanguageToOptions(language));
    });

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [languageService, props.appName, datasetSupportedLanguages]);

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
