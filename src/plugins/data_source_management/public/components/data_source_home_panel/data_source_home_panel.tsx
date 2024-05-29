/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { EuiPageTemplate, EuiSpacer } from '@elastic/eui';
import { DataSourceHeader } from './data_source_page_header';
import { DataSourceTableWithRouter } from '../data_source_table/data_source_table';

export const DataSourceHomePanel: React.FC<RouteComponentProps> = (props) => {
  return (
    <EuiPageTemplate>
      <DataSourceHeader history={props.history} />
      <EuiSpacer size="l" />
      <DataSourceTableWithRouter {...props} />
    </EuiPageTemplate>
  );
};
