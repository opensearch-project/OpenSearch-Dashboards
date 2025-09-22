/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPopover, EuiButtonEmpty } from '@elastic/eui';
import { ColorGroupPanel } from './color_group_panel';
import './color_group_panel.scss';

interface SelectColorButtonProps {
  onChange: (color?: string) => void;
}
export const SelectColorButton: React.FC<SelectColorButtonProps> = ({ onChange }) => {
  const [isPopoverOpen, setPopover] = useState(false);

  const button = (
    <EuiButtonEmpty onClick={() => setPopover(!isPopoverOpen)}>Select color</EuiButtonEmpty>
  );

  return (
    <EuiPopover
      id="colorGroupPanelButton"
      button={button}
      isOpen={isPopoverOpen}
      closePopover={() => setPopover(false)}
      panelPaddingSize="s"
      anchorPosition="downLeft"
      hasArrow={false}
    >
      <ColorGroupPanel onChange={onChange} onClose={() => setPopover(false)} />
    </EuiPopover>
  );
};
