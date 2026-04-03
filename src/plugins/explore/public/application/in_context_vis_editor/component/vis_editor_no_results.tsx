/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiEmptyPrompt, EuiIcon } from '@elastic/eui';

export const VisEditorNoResults = () => {
  return (
    <EuiEmptyPrompt
      className="visEditorEmptyPrompt"
      data-test-subj="visEditorNoResults"
      icon={<EuiIcon type="visualizeApp" size="xl" />}
      title={
        <h2>
          {i18n.translate('explore.visEditor.noResults.title', {
            defaultMessage: 'No results',
          })}
        </h2>
      }
      body={
        <p>
          {i18n.translate('explore.visEditor.noResults.body', {
            defaultMessage: 'Try adjusting your query, expanding the time range',
          })}
        </p>
      }
    />
  );
};
