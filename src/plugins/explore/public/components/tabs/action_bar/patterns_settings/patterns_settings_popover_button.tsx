/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiPopover } from '@elastic/eui';
import React, { useState } from 'react';
import { PatternsSettingsPopoverContent } from './patterns_settings_popover_content';

export const PatternsSettingsPopoverButton = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const openPopover = () => setIsPopoverOpen(true);
  const closePopover = () => setIsPopoverOpen(false);

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          size="s"
          data-test-subj="patternsSettingButton"
          aria-labelledby="patternsSettingsButton"
          iconType="gear"
          onClick={openPopover}
        />
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
