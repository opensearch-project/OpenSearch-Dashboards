/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButton } from '@elastic/eui';
import { i18n } from '@osd/i18n';

// TODO: This component will be fully functional once integrated with query services.
interface RunQueryButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
}

export const RunQueryButton: React.FC<RunQueryButtonProps> = ({
  onClick,
  isDisabled = false,
  isLoading,
}) => {
  return (
    <EuiButton
      fill
      onClick={onClick}
      isDisabled={isDisabled}
      data-test-subj="queryPanelFooterRunQueryButton"
      size="s"
      isLoading={isLoading}
      style={{ marginLeft: '4px' }}
    >
      {i18n.translate('explore.queryPanel.runQueryButton.label', {
        defaultMessage: 'Run query',
      })}
    </EuiButton>
  );
};
