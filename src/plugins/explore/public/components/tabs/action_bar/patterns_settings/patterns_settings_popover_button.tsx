/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiPopover } from '@elastic/eui';
import React, { useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useSelector } from 'react-redux';
import { PatternsSettingsPopoverContent } from './patterns_settings_popover_content';
import { selectPatternsField } from '../../../../application/utils/state_management/selectors';

export const PatternsSettingsPopoverButton = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const patternsField = useSelector(selectPatternsField);

  const openPopover = () => setIsPopoverOpen(true);
  const closePopover = () => setIsPopoverOpen(false);

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          size="s"
          data-test-subj="patternsSettingButton"
          aria-labelledby="patternsSettingsButton"
          iconType="arrowDown"
          iconSide="right"
          onClick={openPopover}
        >
          {patternsField ? (
            <FormattedMessage
              id="explore.discover.patterns.settings.fieldSelector"
              defaultMessage="Patterns field: {patternsField}"
              values={{
                patternsField,
              }}
            />
          ) : (
            <FormattedMessage
              id="explore.discover.patterns.settings.fieldSelectorNoSelection"
              defaultMessage="Select patterns field"
            />
          )}
        </EuiButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      ownFocus={false}
    >
      <PatternsSettingsPopoverContent fieldChange={closePopover} />
    </EuiPopover>
  );
};
