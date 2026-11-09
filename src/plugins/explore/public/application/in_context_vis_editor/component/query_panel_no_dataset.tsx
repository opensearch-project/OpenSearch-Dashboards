/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiEmptyPrompt, EuiIcon } from '@elastic/eui';

// Shown in place of the query editor while the row has no dataset: a query can't run without one,
// and the dataset selector sits in the panel header above.
export const QueryPanelNoDataset = () => {
  return (
    <EuiEmptyPrompt
      data-test-subj="visEditorQueryPanelNoDataset"
      icon={<EuiIcon type="database" size="xl" />}
      title={
        <h2>
          {i18n.translate('explore.visEditor.queryPanel.noDataset.title', {
            defaultMessage: 'Select a dataset first',
          })}
        </h2>
      }
      body={
        <p>
          {i18n.translate('explore.visEditor.queryPanel.noDataset.body', {
            defaultMessage: 'Choose a dataset above to start writing a query.',
          })}
        </p>
      }
    />
  );
};
