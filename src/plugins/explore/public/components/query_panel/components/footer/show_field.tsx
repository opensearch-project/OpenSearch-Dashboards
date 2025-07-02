/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface ShowFieldToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const ShowFieldToggle: React.FC<ShowFieldToggleProps> = ({ isEnabled, onToggle }) => {
  const buttonLabel = isEnabled
    ? i18n.translate('explore.queryPanel.showFieldToggle.hideFieldsLabel', {
        defaultMessage: 'Hide Fields',
      })
    : i18n.translate('explore.queryPanel.showFieldToggle.showFieldsLabel', {
        defaultMessage: 'Show Fields',
      });

  return (
    <EuiButtonEmpty
      onClick={() => onToggle(!isEnabled)}
      iconType={isEnabled ? 'menuLeft' : 'menuRight'}
      data-test-subj="queryPanelFooterShowFields"
      className="queryPanel__footer__showFieldsToggle"
    >
      {buttonLabel}
    </EuiButtonEmpty>
  );
};
