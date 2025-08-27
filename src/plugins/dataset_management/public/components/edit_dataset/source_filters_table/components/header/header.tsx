/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { EuiTitle, EuiText, EuiSpacer } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

export const Header = () => (
  <>
    <EuiTitle size="s">
      <h3>
        <FormattedMessage
          id="datasetManagement.editDataset.sourceHeader"
          defaultMessage="Source filters"
        />
      </h3>
    </EuiTitle>
    <EuiText size="s">
      <p>
        <FormattedMessage
          id="datasetManagement.editDataset.sourceLabel"
          defaultMessage="Source filters can be used to exclude one or more fields when fetching the document source. This happens when
          viewing a document in the Discover app, or with a table displaying results from a saved search in the Dashboard app. Each row is
          built using the source of a single document, and if you have documents with large or unimportant fields you may benefit from
          filtering those out at this lower level."
        />
      </p>
      <p>
        <FormattedMessage
          id="datasetManagement.editDataset.source.noteLabel"
          defaultMessage="Note that multi-fields will incorrectly appear as matches in the table below. These filters only actually apply
          to fields in the original source document, so matching multi-fields are not actually being filtered."
        />
      </p>
    </EuiText>
    <EuiSpacer size="s" />
  </>
);
