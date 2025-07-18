/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiPopover, EuiSelect, EuiText } from '@elastic/eui';
import React, { useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';

export const PatternsSettingsPopoverButton = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const openPopover = () => setIsPopoverOpen(true);
  const closePopover = () => setIsPopoverOpen(false);

  const options = [
    { value: 'one', text: 'products.product_name' },
    { value: 'two', text: 'message' },
    { value: 'three', text: 'Dest' },
  ];

  const [value, setValue] = useState(options[0].value);

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          size="s"
          data-test-subj="patternsSettingButton"
          // disabled={isLoading}
          iconType="gear"
          onClick={openPopover}
        />
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      ownFocus={false}
    >
      <div className="dscDownloadCsvPopoverContent" data-test-subj="dscDownloadCsvPopoverContent">
        <div className="dscDownloadCsvPopoverContent__titleWrapper">
          <EuiText data-test-subj="dscDownloadCsvTitle" size="m">
            <strong>
              <FormattedMessage
                id="explore.discover.downloadCsvTitle"
                defaultMessage="Patterns Field"
              />
            </strong>
          </EuiText>
        </div>
        <div className="dscDownloadCsvPopoverContent__form">
          <EuiSelect
            options={options}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
          />
        </div>
      </div>
    </EuiPopover>
  );
};
