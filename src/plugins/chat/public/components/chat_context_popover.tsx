/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiButtonIcon, EuiIcon, EuiListGroup, EuiListGroupItem, EuiPopover } from '@elastic/eui';

export const ChatContextPopover: React.FC<{
  enabled: boolean;
  options?: Array<{
    title: string;
    iconType: string;
    onClick: () => void;
  }>;
}> = ({
  enabled = true,
  options = [
    {
      title: 'Add dashboard screenshot',
      iconType: 'image',
      onClick: () => {},
    },
  ],
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const closePopover = () => setIsPopoverOpen(false);
  const onButtonClick = () => setIsPopoverOpen((isOpen) => !isOpen);

  if (!enabled || options.length === 0) {
    return null;
  }

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          iconType="plus"
          aria-label="Add context"
          size="m"
          color="text"
          className="chatInput__addButton"
          onClick={onButtonClick}
        />
      }
      anchorPosition="leftCenter"
      repositionOnScroll
      panelPaddingSize="none"
      panelStyle={{ borderRadius: 8 }}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
    >
      <EuiListGroup>
        {options.map((option, index) => (
          <EuiListGroupItem
            key={index}
            size="s"
            label={option.title}
            style={{ fontWeight: 400 }}
            icon={<EuiIcon aria-label={option.title} type={option.iconType} size="m" />}
            onClick={() => {
              option.onClick();
              closePopover();
            }}
          />
        ))}
      </EuiListGroup>
    </EuiPopover>
  );
};
