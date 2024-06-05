/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { DataSource, IDataSourceFilter } from '../../../../../data/public';
import { useSelector } from '../../utils/state_management';
import { DiscoverViewServices } from '../../../build_services';

export const useDataSource = (services: DiscoverViewServices) => {
  const dataSourceId = useSelector((state) => state.metadata.dataSource);
  const [dataSource, setDataSource] = useState<DataSource | undefined>(undefined);
  const { data } = services;

  useEffect(() => {
    let isMounted = true;
    let subscription;

    if (dataSourceId) {
      // get the data source object from the id
      subscription = data.dataSources.dataSourceService
        .getDataSources$([dataSourceId] as IDataSourceFilter)
        .subscribe((ds) => {
          if (isMounted) {
            setDataSource(ds[dataSourceId]);
          }
        });
    } else {
      subscription = data.dataSources.dataSourceService.getDataSources$().subscribe(() => {});
    }

    return () => {
      subscription.unsubscribe();
      isMounted = false;
    };
  }, [dataSourceId, data.dataSources]);

  return dataSource;
};
