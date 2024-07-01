/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { IDataPluginServices } from '../../../../../src/plugins/data/public';
import { QueryEditorExtensionDependencies } from '../../../../../src/plugins/data/public/ui/query_editor/query_editor_extensions/query_editor_extension';
import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  DataSourceSelector,
  DataSourceOption,
} from '../../../../../src/plugins/data_source_management/public';
import { DataSourceConnectionServiceStart } from '../services/data_source_connection_service';

interface DataSourceConnectionProps {
  dependencies: QueryEditorExtensionDependencies;
  connectionService: DataSourceConnectionServiceStart;
}

export const DataSourceConnectionBar: React.FC<DataSourceConnectionProps> = ({
  connectionService,
}) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const {
    savedObjects,
    notifications: { toasts },
  } = services;
  const [selectedConnection, setSelectedConnection] = useState<DataSourceOption | undefined>(
    undefined
  );

  useEffect(() => {
    const subscriptions = connectionService.getSelectedConnection$().subscribe((connection) => {
      setSelectedConnection(connection);
    });
    return () => {
      subscriptions.unsubscribe();
    };
  }, [connectionService]);

  return (
    <DataSourceSelector
      savedObjectsClient={savedObjects.client}
      notifications={toasts}
      disabled={false}
      fullWidth={false}
      onSelectedDataSource={(dataSource) =>
        connectionService.setSelectedConnection(dataSource[0]?.id || undefined)
      }
    />
  );
};
