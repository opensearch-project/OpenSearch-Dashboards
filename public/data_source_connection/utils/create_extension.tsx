/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QueryEditorExtensionConfig } from '../../../../../src/plugins/data/public/ui/query_editor';
import { PublicConfig } from '../../plugin';
import { DataSourceConnectionBar } from '../components';
import { DataSourceConnectionServiceStart } from '../services/data_source_connection_service';

export const createDataSourceConnectionExtension = (
  connectionService: DataSourceConnectionServiceStart,
  config: PublicConfig
): QueryEditorExtensionConfig => {
  return {
    id: 'data-source-connection',
    order: 2000,
    isEnabled: async (dependencies) => {
      return !!dependencies.dataSource;
    },
    getComponent: (dependencies) => {
      return (
        <DataSourceConnectionBar
          dependencies={dependencies}
          connectionService={connectionService}
        />
      );
    },
  };
};
