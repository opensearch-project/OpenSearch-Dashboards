/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { EuiPortal } from '@elastic/eui';
import { distinctUntilChanged } from 'rxjs/operators';
import { ToastsSetup } from 'opensearch-dashboards/public';
import { DataPublicPluginStart, QueryEditorExtensionDependencies } from '../../../../data/public';
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
    const uiServiceSubscription = connectionsService.getUiService().subscribe(setUiService);
    const dataSourceEnabledSubscription = connectionsService
      .getIsDataSourceEnabled$()
      .subscribe(setIsDataSourceEnabled);

    return () => {
      uiServiceSubscription.unsubscribe();
      dataSourceEnabledSubscription.unsubscribe();
    };
  }, [connectionsService]);

  useEffect(() => {
    if (!uiService || !isDataSourceEnabled || !containerRef.current) return;
    const subscriptions = uiService.dataSourceContainer$.subscribe((container) => {
      if (container && containerRef.current) {
        container.append(containerRef.current);
      }
    });

    return () => subscriptions.unsubscribe();
  }, [uiService, isDataSourceEnabled]);

  useEffect(() => {
    const selectedConnectionSubscription = connectionsService
      .getSelectedConnection$()
      .pipe(distinctUntilChanged())
      .subscribe((connection) => {
        if (connection) {
          // Assuming setSelectedConnection$ is meant to update some state or perform an action outside this component
          connectionsService.setSelectedConnection$(connection);
        }
      });

    return () => selectedConnectionSubscription.unsubscribe();
  }, [connectionsService]);

  const handleSelectedConnection = (id: string | undefined) => {
    if (!id) {
      connectionsService.setSelectedConnection$(undefined);
      return;
    }
    connectionsService.getConnectionById(id).subscribe((connection) => {
      connectionsService.setSelectedConnection$(connection);
    });
  };

  return (
    <EuiPortal
      portalRef={(node) => {
        containerRef.current = node;
      }}
    >
      <div className="dataSourceSelect" />
    </EuiPortal>
  );
};
