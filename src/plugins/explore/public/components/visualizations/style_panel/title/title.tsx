/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EuiFormRow, EuiInputPopover, EuiListGroup, EuiListGroupItem } from '@elastic/eui';
import { StyleAccordion } from '../style_accordion';
import { TitleOptions } from '../../types';
import { DebouncedFieldText } from '../utils';

export interface TitleOptionsPanelProps {
  titleOptions: TitleOptions;
  onShowTitleChange: (show: Partial<TitleOptions>) => void;
  initialIsOpen?: boolean;
  suggestions?: string[];
}

export const TitleOptionsPanel = ({
  titleOptions,
  onShowTitleChange,
  initialIsOpen = false,
  suggestions = [],
}: TitleOptionsPanelProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleIsPopoverOpen = useCallback(() => {
    if (!isPopoverOpen && !titleOptions.titleName && suggestions.length > 0) {
      setIsPopoverOpen(true);
    }
  }, [isPopoverOpen, titleOptions.titleName, suggestions.length]);

  useEffect(() => {
    if (titleOptions.titleName) {
      setIsPopoverOpen(false);
    } else {
      if (inputRef.current === document.activeElement && suggestions.length > 0) {
        setIsPopoverOpen(true);
      }
    }
  }, [titleOptions.titleName, suggestions.length]);

  const input = (
    <DebouncedFieldText
      inputRef={inputRef}
      compressed
      value={titleOptions.titleName}
      onChange={(value) => onShowTitleChange({ titleName: value })}
      placeholder={i18n.translate('explore.stylePanel.title.default', {
        defaultMessage: 'Panel title',
      })}
      onFocus={() => toggleIsPopoverOpen()}
    />
  );
  return (
    <StyleAccordion
      id="titleSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.panelSettings', {
        defaultMessage: 'Panel settings',
      })}
      initialIsOpen={initialIsOpen}
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.title.displayName', {
          defaultMessage: 'Title',
        })}
      >
        <EuiInputPopover
          panelPaddingSize="none"
          input={input}
          isOpen={isPopoverOpen}
          closePopover={() => {
            setIsPopoverOpen(false);
          }}
        >
          <EuiListGroup flush size="l" showToolTips gutterSize="none">
            {suggestions.map((suggestedTitle, i) => (
              <EuiListGroupItem
                key={i}
                onClick={() => {
                  onShowTitleChange({ titleName: suggestedTitle });
                }}
                label={suggestedTitle}
              />
            ))}
          </EuiListGroup>
        </EuiInputPopover>
      </EuiFormRow>
    </StyleAccordion>
  );
};
