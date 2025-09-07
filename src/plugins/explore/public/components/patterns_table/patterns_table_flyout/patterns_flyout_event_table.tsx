/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBasicTable } from '@elastic/eui';
import React from 'react';
import { i18n } from '@osd/i18n';

// TODO: remove record param in favor of sending out a query and getting a response back
export const PatternsFlyoutEventTable = ({ recordSample }: { recordSample: string[] }) => {
  return (
    <EuiBasicTable
      items={recordSample.map((event: string) => ({ event }))}
      columns={[
        {
          field: 'event',
          name: i18n.translate('explore.patterns.flyout.eventsColumnName', {
            defaultMessage: 'Event',
          }),
          sortable: false,
          width: '100%',
        },
      ]}
      tableLayout="auto"
    />
  );
};
