/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiEmptyPrompt, EuiIcon } from '@elastic/eui';

export const VisEditorUninitialized = () => {
  return (
    <EuiEmptyPrompt
      className="visEditorEmptyPrompt"
      data-test-subj="visEditorUninitialized"
      icon={<EuiIcon type="visualizeApp" size="xl" />}
      title={
        <h2>
          {i18n.translate('explore.visEditor.uninitialized.title', {
            defaultMessage: 'Run a query to visualize your data',
          })}
        </h2>
      }
      body={
        <p>
          {i18n.translate('explore.visEditor.uninitialized.body', {
            defaultMessage:
              'Write a query in the editor below, then run it to see your data visualized.',
          })}
        </p>
      }
    />
  );
};
