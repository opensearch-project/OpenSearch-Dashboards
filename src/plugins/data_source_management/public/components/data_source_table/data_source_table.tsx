/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiTitle } from '@elastic/eui';
import React, { useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { ChromeBreadcrumb } from 'src/core/public';

export interface DataSourceTableProps {
  setBreadcrumbs: (crumbs: ChromeBreadcrumb[]) => void;
}

export const DataSourceTable = ({setBreadcrumbs}: DataSourceTableProps) => {
  useEffect(() => {
    setBreadcrumbs([
      {
        text: i18n.translate('dataSourceManagement.breadcrumb.index', {
          defaultMessage: 'Data Sources',
        }),
        href: '/',
      },
    ]);
  }, [setBreadcrumbs]);
  return (
    <EuiTitle>
      <h2>{'This is the landing page, going to list data sources here...'}</h2>
    </EuiTitle>
  );
};

export {DataSourceTable as default}
