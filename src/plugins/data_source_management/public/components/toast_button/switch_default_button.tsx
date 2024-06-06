/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton } from '@elastic/eui';
import React from 'react';
import { i18n } from '@osd/i18n';

export const switchToDefaultButton = (handleSwitchDefaultDatasource: () => Promise<void>) => {
  return (
    <EuiButton
      data-test-subj="dataSourceViewErrorSwitchButton"
      fill={false}
      size="s"
      onClick={handleSwitchDefaultDatasource}
    >
      {i18n.translate('dataSourcesManagement.dataSourceViewError.switchToDefaultDataSource', {
        defaultMessage: 'Switch to default data source',
      })}
    </EuiButton>
  );
};
