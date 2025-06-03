/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';

interface ShowFieldToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const ShowFieldToggle: React.FC<ShowFieldToggleProps> = ({ isEnabled, onToggle }) => {
  const [showField, setShowField] = useState(isEnabled);

  const handleToggle = () => {
    const newState = !showField;
    setShowField(newState);
    onToggle(newState);
  };

  return (
    <EuiButtonEmpty
      onClick={handleToggle}
      iconType={showField ? 'menuLeft' : 'menuRight'} // Add the folderOpen icon
      data-test-subj="showFields"
      className="showFieldsToggle"
    >
      {showField ? 'Hide Fields' : 'Show Fields'}
    </EuiButtonEmpty>
  );
};
