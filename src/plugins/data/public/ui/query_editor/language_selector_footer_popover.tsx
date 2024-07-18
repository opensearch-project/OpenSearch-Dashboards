/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiComboBoxOptionOption,
  PopoverAnchorPosition,
  EuiContextMenuPanel,
  EuiPopover,
  EuiButtonEmpty,
  EuiContextMenuItem,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import { getUiService } from '../../services';

export interface QueryLanguageSelectorFooterProps {
  language: string;
  onSelectLanguage: (newLanguage: string) => void;
  anchorPosition?: PopoverAnchorPosition;
  appName?: string;
  languageSelectorContainerRef?: React.RefCallback<HTMLDivElement>;
  noArrow?: boolean;
}

const mapExternalLanguageToOptions = (language: string) => {
  return {
    label: language,
    value: language,
  };
};

export const QueryLanguageSelectorFooter = (props: QueryLanguageSelectorFooterProps) => {
  const [isPopoverOpen, setPopover] = useState(false);

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const ref = React.createRef<HTMLDivElement>();
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

  const handleLanguageChange = (newLanguage: any) => {
    props.onSelectLanguage(newLanguage);
    uiService.Settings.setUserQueryLanguage(newLanguage);
  };

  // language selector at the footer of the query bar
  const button = (
    <EuiButtonEmpty
      size="s"
      iconType="arrowDown"
      iconSide="right"
      onClick={onButtonClick}
      style={{
        fontSize: 'smaller',
        color: 'grey',
        height: '9px',
        paddingLeft: '0px',
        paddingTop: '2px',
      }}
    >
      {props.language}
    </EuiButtonEmpty>
  );
  const getIconType = (language: string) => {
    return language === props.language ? 'check' : 'empty';
  };

  const languageOptionsMenu = languageOptions.map((language) => {
    return (
      <EuiContextMenuItem
        key={language.label}
        icon={getIconType(language.label)}
        onClick={() => {
          closePopover();
          handleLanguageChange(language.value);
        }}
      >
        {language.label}
      </EuiContextMenuItem>
    );
  });
  return (
    <EuiPopover
      id="languageSelectorPopover"
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downLeft"
    >
      <EuiContextMenuPanel size="s" items={languageOptionsMenu} />
    </EuiPopover>
  );
};

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default QueryLanguageSelectorFooter;
