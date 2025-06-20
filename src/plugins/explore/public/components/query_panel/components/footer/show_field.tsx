/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';

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

  const buttonLabel = showField
    ? i18n.translate('explore.queryPanel.showFieldToggle.hideFieldsLabel', {
        defaultMessage: 'Hide Fields',
      })
    : i18n.translate('explore.queryPanel.showFieldToggle.showFieldsLabel', {
        defaultMessage: 'Show Fields',
      });

  return (
    <EuiButtonEmpty
      onClick={handleToggle}
      iconType={showField ? 'menuLeft' : 'menuRight'}
      data-test-subj="queryPanelFooterShowFields"
      className="queryPanel__footer__showFieldsToggle"
    >
      {buttonLabel}
    </EuiButtonEmpty>
  );
};
