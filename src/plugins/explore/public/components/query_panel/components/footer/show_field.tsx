/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiSwitch } from '@elastic/eui';

interface ShowFieldToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const ShowFieldToggle: React.FC<ShowFieldToggleProps> = ({ isEnabled, onToggle }) => {
  const [isChecked, setIsChecked] = useState(isEnabled);

  const handleToggle = (e: any) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    onToggle(checked);
  };

  return (
    <EuiSwitch
      label="Show Fields"
      checked={isChecked}
      onChange={(e) => handleToggle(e)}
      data-test-subj="showFieldsToggle"
    />
  );
};
