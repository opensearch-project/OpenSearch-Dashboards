/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import React from 'react';
import { CoreStart } from 'src/core/public';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';

import { DatasetSelect, DatasetSelectProps } from './';
import { DataPublicPluginStart } from '../../types';
import { DataStorage } from '../../../common';

interface DatasetSelectDeps {
  core: CoreStart;
  data: Omit<DataPublicPluginStart, 'ui'>;
  storage: DataStorage;
}

export function createDatasetSelect({ core, data, storage }: DatasetSelectDeps) {
  return (props: DatasetSelectProps) => {
    return (
      <OpenSearchDashboardsContextProvider
        services={{
          // @ts-expect-error TS2339 TODO(ts-error): fixme
          appName: props.appName,
          data,
          storage,
          ...core,
        }}
      >
        <DatasetSelect {...props} />
      </OpenSearchDashboardsContextProvider>
    );
  };
}
