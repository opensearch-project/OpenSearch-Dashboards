/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { SavedObjectsStart } from 'opensearch-dashboards/public';
import { EuiBadge, EuiLink } from '@elastic/eui';
import React from 'react';
import { IndexPatternTableColumn } from '../../../../index_pattern_management/public';
import { getApplication, getDataSources } from '../utils';
import { DataSourceTableItem } from '../../types';
import { DSM_APP_ID } from '../../plugin';

type DataSourceMap = Map<string, DataSourceTableItem> | undefined;

export class DataSourceColumn implements IndexPatternTableColumn<DataSourceMap> {
  public readonly id: string = 'data_source';
  public data: DataSourceMap;

  public euiColumn = {
    field: 'referenceId',
    name: i18n.translate('dataSourcesManagement.dataSourceColumn', {
      defaultMessage: 'Data Source Connection',
    }),
    render: (referenceId: string) => {
      if (!referenceId) {
        return null;
      }

      const dataSource = this.data?.get(referenceId);

      if (!dataSource) {
        // Index pattern has the referenceId but data source not found.
        return <EuiBadge color="danger">Deleted</EuiBadge>;
      }

      const { title, id } = dataSource;

      return (
        <EuiLink
          onClick={() =>
            getApplication().navigateToApp('management', {
              path: `opensearch-dashboards/${DSM_APP_ID}/${encodeURIComponent(id)}`,
            })
          }
          style={this.useUpdatedUX ? { fontWeight: 'normal' } : {}}
        >
          {title}
        </EuiLink>
      );
    },
  };

  constructor(
    private readonly savedObjectPromise: Promise<SavedObjectsStart>,
    private readonly useUpdatedUX: boolean
  ) {}

  public loadData = async () => {
    const savedObject = await this.savedObjectPromise;

    return getDataSources(savedObject.client).then((dataSources?: DataSourceTableItem[]) => {
      this.data = dataSources?.reduce(
        (map, dataSource) => map.set(dataSource.id, dataSource),
        new Map<string, DataSourceTableItem>()
      );
      return this.data;
    });
  };
}
