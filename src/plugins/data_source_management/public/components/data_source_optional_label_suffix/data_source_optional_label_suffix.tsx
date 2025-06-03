/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';

import './data_source_optional_label_suffix.scss';

export const DataSourceOptionalLabelSuffix = () => (
  <span className="dataSourceManagement-optionalSuffix">
    &ndash;&nbsp;
    <FormattedMessage
      id="dataSourcesManagement.createDataSource.optionalText"
      defaultMessage="optional"
    />
  </span>
);
