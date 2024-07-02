/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EuiPortal } from '@elastic/eui';
import { combineLatest } from 'rxjs';
import { DataPublicPluginStart, IDataPluginServices } from '../../../../../src/plugins/data/public';
import { QueryEditorExtensionDependencies } from '../../../../../src/plugins/data/public/ui/query_editor/query_editor_extensions/query_editor_extension';
import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  DataSourceSelector,
  DataSourceOption,
} from '../../../../../src/plugins/data_source_management/public';
import { ConnectionsService } from '../services';

interface ConnectionsProps {
  dependencies: QueryEditorExtensionDependencies;
  connectionsService: ConnectionsService;
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
  const [isDataSourceEnabled, setIsDataSourceEnabled] = useState<boolean>(false);
  const [uiService, setUiService] = useState<DataPublicPluginStart['ui'] | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const subscription = combineLatest([
      connectionsService.getUiService(),
      connectionsService.getDataSourceEnabled(),
    ]).subscribe(([service, enabled]) => {
      setUiService(service);
      setIsDataSourceEnabled(enabled);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [connectionsService]);

  const setContainerRef = useCallback((uiContainerRef) => {
    if (uiContainerRef && containerRef.current) {
      uiContainerRef.append(containerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!uiService || !isDataSourceEnabled) return;
    const subscriptions = uiService.dataSourceContainer$.subscribe((container) => {
      if (container === null) return;
      setContainerRef(container);
    });

    return () => {
      subscriptions.unsubscribe();
    };
  }, [
    uiService,
    uiService?.dataSourceContainer$,
    containerRef,
    setContainerRef,
    isDataSourceEnabled,
  ]);

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
      connectionsService.getConnectionById(id).subscribe((connection) => {
        setSelectedConnection(connection);
      });
    },
    [connectionsService]
  );

  return (
    <EuiPortal
      portalRef={(node) => {
        containerRef.current = node;
      }}
    >
      <div className="dataSourceSelect">
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
      </div>
    </EuiPortal>
  );
};
