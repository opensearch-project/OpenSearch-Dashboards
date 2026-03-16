/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
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
  // Pre-compute the stable parts of the services object once in the closure.
  // This prevents creating a new object reference on every render, which would
  // cause OpenSearchDashboardsContextProvider to produce a new context value
  // and trigger unnecessary re-renders and API calls in descendant components.
  const baseServices = { data, storage, ...core };

  return (props: DatasetSelectProps) => {
    const services = useMemo(() => ({ ...baseServices, appName: props.appName }), [props.appName]);

    return (
      <OpenSearchDashboardsContextProvider services={services}>
        <DatasetSelect {...props} />
      </OpenSearchDashboardsContextProvider>
    );
  };
}
