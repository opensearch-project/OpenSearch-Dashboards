/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { HttpStart, SavedObjectsStart } from 'opensearch-dashboards/public';
import { EuiBadge, EuiLink } from '@elastic/eui';
import React from 'react';
import {
  IndexPatternTableColumn,
  IndexPatternTableRecord,
} from '../../../../index_pattern_management/public';
import { getDataSources } from '../utils';
import { DataSourceTableItem } from '../../types';

type DataSourceColumnItem = DataSourceTableItem & { relativeUrl: string };
type DataSourceMap = Map<string, DataSourceColumnItem> | undefined;

export class DataSourceColumn implements IndexPatternTableColumn<DataSourceMap> {
  public readonly id: string = 'data_source';
  public data: DataSourceMap;

  public euiColumn = {
    field: 'referenceId',
    name: i18n.translate('dataSource.management.dataSourceColumn', {
      defaultMessage: 'Data Source Connection',
    }),
    render: (referenceId: string, index: IndexPatternTableRecord) => {
      if (!referenceId) {
        return null;
      }

      const dataSource = this.data?.get(referenceId);
      if (!dataSource) {
        // Index pattern has the referenceId but data source not found.
        return <EuiBadge color="danger">Deleted</EuiBadge>;
      }

      const { title, relativeUrl } = dataSource;
      return <EuiLink href={relativeUrl}>{title}</EuiLink>;
    },
  };

  constructor(
    private readonly savedObjectPromise: Promise<SavedObjectsStart>,
    private readonly httpPromise: Promise<HttpStart>
  ) {}

  public loadData = async () => {
    const savedObject = await this.savedObjectPromise;
    const { basePath } = await this.httpPromise;

    return getDataSources(savedObject.client).then((dataSources?: DataSourceTableItem[]) => {
      this.data = dataSources
        ?.map((dataSource) => {
          return {
            ...dataSource,
            relativeUrl: basePath.prepend(
              `/app/management/opensearch-dashboards/dataSources/${encodeURIComponent(
                dataSource.id
              )}`
            ),
          };
        })
        ?.reduce(
          (map, dataSource) => map.set(dataSource.id, dataSource),
          new Map<string, DataSourceColumnItem>()
        );
      return this.data;
    });
  };
}
