/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EuiPortal } from '@elastic/eui';
import { combineLatest } from 'rxjs';
import { ToastsSetup } from 'opensearch-dashboards/public';
import { DataPublicPluginStart } from '../../../../data/public';
import { QueryEditorExtensionDependencies } from '../../../../data/public';
import { DataSourceSelector } from '../../../../data_source_management/public';
import { ConnectionsService } from '../services';

interface ConnectionsProps {
  dependencies: QueryEditorExtensionDependencies;
  toasts: ToastsSetup;
  connectionsService: ConnectionsService;
}

export const ConnectionsBar: React.FC<ConnectionsProps> = ({ connectionsService, toasts }) => {
  const [isDataSourceEnabled, setIsDataSourceEnabled] = useState<boolean>(false);
  const [uiService, setUiService] = useState<DataPublicPluginStart['ui'] | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const subscription = combineLatest([
      connectionsService.getUiService(),
      connectionsService.getIsDataSourceEnabled$(),
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
    const subscriptions = connectionsService.getSelectedConnection$().subscribe((connection) => {
      connectionsService.setSelectedConnection$(connection);
    });
    return () => {
      subscriptions.unsubscribe();
    };
  }, [connectionsService]);

  const handleSelectedConnection = useCallback(
    (id: string | undefined) => {
      if (!id) {
        connectionsService.setSelectedConnection$(undefined);
        return;
      }
      connectionsService.getConnectionById(id).subscribe((connection) => {
        connectionsService.setSelectedConnection$(connection);
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
          savedObjectsClient={connectionsService.getSavedObjects().client}
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
