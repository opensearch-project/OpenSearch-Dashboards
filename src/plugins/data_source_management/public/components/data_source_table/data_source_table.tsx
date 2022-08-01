/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { EuiTitle } from '@elastic/eui';
import React from 'react';
import { withRouter } from 'react-router-dom';

export const DataSourceTable = () => {
  return (
    <EuiTitle>
      <h2>{'This is the landing page, going to list data sources here...'}</h2>
    </EuiTitle>
  );
};

export const DataSourceTableWithRouter = withRouter(DataSourceTable);
