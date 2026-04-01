/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiEmptyPrompt, EuiLoadingSpinner } from '@elastic/eui';

export const VisEditorLoadingState = () => {
  return (
    <EuiEmptyPrompt
      className="visEditorEmptyPrompt"
      data-test-subj="visEditorLoading"
      icon={<EuiLoadingSpinner size="xl" data-test-subj="visEditorLoadingSpinner" />}
      title={
        <h2>
          {i18n.translate('explore.visEditor.loading.title', {
            defaultMessage: 'Running query',
          })}
        </h2>
      }
    />
  );
};
