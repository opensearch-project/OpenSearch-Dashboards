/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiIcon,
  EuiPopover,
} from '@elastic/eui';
import React, { useCallback, useState, useRef } from 'react';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { OverlayRef } from '../../../../../../src/core/public';
import {
  toMountPoint,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { AssociationDataSourceModalContent } from '../workspace_detail/association_data_source_modal';
import { AssociationDataSourceModalMode } from '../../../common/constants';
import { DataSourceConnection, DataSourceConnectionType } from '../../../common/types';

interface Props {
  excludedDataSourceIds: string[];
  onComplete?: () => void;
  onError?: () => void;
}

export const DataSourceAssociation = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const associationModalRef = useRef<OverlayRef>();

  const {
    chrome,
    savedObjects,
    http,
    notifications,
    overlays,
    workspaces,
  } = useOpenSearchDashboards().services;
  const workspaceClient = useObservable(workspaces?.client$ ?? of(null));
  const currentWorkspaceId = useObservable(workspaces?.currentWorkspaceId$ ?? of(null));

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openPopover = useCallback(() => {
    setIsOpen(true);
  }, []);

  const onAssociateDataSource = useCallback(
    async (ds: DataSourceConnection[]) => {
      const objects = ds
        .filter((d) => d.connectionType === DataSourceConnectionType.OpenSearchConnection)
        .map((d) => ({ id: d.id, type: 'data-source' }));

      if (workspaceClient && currentWorkspaceId) {
        let failedCount = 0;
        try {
          const res = await workspaceClient.associate(objects, currentWorkspaceId);

          if (res.success) {
            failedCount = res.result.filter((r) => !!r.error).length;
          } else {
            // If failed to workspaceClient.associate, all data sources association is failed
            failedCount = objects.length;
          }
          props.onComplete?.();
        } catch (e) {
          failedCount = objects.length;
          props.onError?.();
        } finally {
          associationModalRef.current?.close();
        }

        if (failedCount > 0) {
          notifications?.toasts.addDanger({
            id: 'workspace_data_source_association_failed',
            title: i18n.translate('workspace.dataSource.association.failedTitle', {
              defaultMessage:
                'Failed to associate {failedCount, plural, one {the data source} other {# data sources}} to the workspace',
              values: { failedCount },
            }),
          });
        }
        if (failedCount < objects.length) {
          notifications?.toasts.addSuccess({
            id: 'workspace_data_source_association_succeed',
            title: i18n.translate('workspace.dataSource.association.succeedTitle', {
              defaultMessage:
                '{succeedCount, plural, one {the data source} other {# data sources}} been associated to the workspace',
              values: { succeedCount: objects.length - failedCount },
            }),
          });
        }
      }
    },
    [workspaceClient, currentWorkspaceId, notifications]
  );

  const showAssociationModal = useCallback(
    (mode: AssociationDataSourceModalMode) => {
      closePopover();
      if (overlays && savedObjects && chrome) {
        associationModalRef.current = overlays.openModal(
          toMountPoint(
            <AssociationDataSourceModalContent
              http={http}
              savedObjects={savedObjects}
              notifications={notifications}
              excludedConnectionIds={props.excludedDataSourceIds}
              closeModal={() => associationModalRef.current?.close()}
              handleAssignDataSourceConnections={onAssociateDataSource}
              mode={mode}
              logos={chrome.logos}
            />
          )
        );
      }
    },
    [
      overlays,
      chrome,
      http,
      notifications,
      savedObjects,
      closePopover,
      props.excludedDataSourceIds,
      onAssociateDataSource,
    ]
  );

  const button = (
    <EuiButton size="s" fill iconType="arrowDown" iconSide="right" onClick={openPopover}>
      <EuiIcon type="plusInCircle" />{' '}
      {i18n.translate('workspace.dataSources.associationButton.label', {
        defaultMessage: 'Associate data sources',
      })}
    </EuiButton>
  );

  const items = [
    <EuiContextMenuItem
      key="opensearchDataSources"
      onClick={() => showAssociationModal(AssociationDataSourceModalMode.OpenSearchConnections)}
    >
      {i18n.translate('workspace.dataSources.associationButton.opensearch.label', {
        defaultMessage: 'OpenSearch data sources',
      })}
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="directQueryDataSources"
      onClick={() => showAssociationModal(AssociationDataSourceModalMode.DirectQueryConnections)}
    >
      {i18n.translate('workspace.dataSources.associationButton.directQuery.label', {
        defaultMessage: 'Direct query data sources',
      })}
    </EuiContextMenuItem>,
  ];

  return (
    <EuiPopover
      button={button}
      isOpen={isOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downLeft"
    >
      <EuiContextMenuPanel items={items} />
    </EuiPopover>
  );
};
