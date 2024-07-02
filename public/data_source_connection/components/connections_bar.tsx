/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { IDataPluginServices } from '../../../../../src/plugins/data/public';
import { QueryEditorExtensionDependencies } from '../../../../../src/plugins/data/public/ui/query_editor/query_editor_extensions/query_editor_extension';
import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  DataSourceSelector,
  DataSourceOption,
} from '../../../../../src/plugins/data_source_management/public';
import { IConnectionsServiceSetup } from '../../types';

interface ConnectionsProps {
  dependencies: QueryEditorExtensionDependencies;
  connectionsService: IConnectionsServiceSetup;
}

export const ConnectionsBar: React.FC<ConnectionsProps> = ({ connectionsService }) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const {
    savedObjects,
    notifications: { toasts },
  } = services;
  const [selectedConnection, setSelectedConnection] = useState<DataSourceOption | undefined>(
    undefined
  );

  useEffect(() => {
    const subscriptions = connectionsService.getSelectedConnection().subscribe((connection) => {
      setSelectedConnection(connection);
    });
    return () => {
      subscriptions.unsubscribe();
    };
  }, [connectionsService]);

  const handleSelectedConnection = useCallback(
    (id: string | undefined) => {
      if (!id) {
        setSelectedConnection(undefined);
        return;
      }
      connectionsService.getConnectionById(id).then((connection) => {
        setSelectedConnection(connection);
      });
    },
    [connectionsService]
  );

  return (
    <DataSourceSelector
      savedObjectsClient={savedObjects.client}
      notifications={toasts}
      disabled={false}
      fullWidth={false}
      removePrepend={true}
      isClearable={false}
      onSelectedDataSource={(dataSource) =>
        handleSelectedConnection(dataSource[0]?.id || undefined)
      }
    />
  );
};
