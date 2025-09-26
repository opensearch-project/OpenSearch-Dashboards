/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPopover } from '@elastic/eui';
import { ColorGroupPanel } from './color_group_panel';
import { resolveColor } from '../../theme/default_colors';
import './color_group_panel.scss';

interface ColorGroupButtonProps {
  buttonColor: string;
  onChange: (color?: string) => void;
}
export const ColorGroupButton: React.FC<ColorGroupButtonProps> = ({ buttonColor, onChange }) => {
  const [isPopoverOpen, setPopover] = useState(false);

  const button = (
    <button
      className="colorCircle"
      style={{
        backgroundColor: resolveColor(buttonColor),
        border: buttonColor === 'transparent' ? '1px solid #ccc' : 'none',
      }}
      onClick={() => setPopover(!isPopoverOpen)}
    />
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
      <ColorGroupPanel color={buttonColor} onChange={onChange} onClose={() => setPopover(false)} />
    </EuiPopover>
  );
};
