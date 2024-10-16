/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiButton, EuiPageContent, EuiPageContentBody } from '@elastic/eui';

interface NoDatasetPanelProps {
  onOpenDataSelector: () => void;
}

export const NoDatasetPanel: React.FC<NoDatasetPanelProps> = ({ onOpenDataSelector }) => {
  return (
    <EuiPageContent
      hasBorder={false}
      hasShadow={false}
      paddingSize="none"
      color="transparent"
      borderRadius="none"
    >
      <EuiPageContentBody>
        <EuiEmptyPrompt
          title={<h2>Add data</h2>}
          body={<p>Associate data sources to your workspace</p>}
          actions={
            <EuiButton onClick={onOpenDataSelector} fill>
              Manage data sources
            </EuiButton>
          }
        />
      </EuiPageContentBody>
    </EuiPageContent>
  );
};
