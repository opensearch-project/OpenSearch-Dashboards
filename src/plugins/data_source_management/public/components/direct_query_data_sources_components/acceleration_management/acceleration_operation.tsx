/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { CachedAcceleration, DirectQueryLoadingStatus } from '../../../../framework/types';
import { useDirectQuery } from '../../../../framework/hooks/direct_query_hook';
import {
  AccelerationActionType,
  generateAccelerationOperationQuery,
  getAccelerationName,
} from './acceleration_utils';

export const useAccelerationOperation = (
  dataSource: string,
  http: HttpStart,
  notifications: NotificationsStart,
  dataSourceMDSId?: string
) => {
  const { startLoading, stopLoading, loadStatus } = useDirectQuery(
    http,
    notifications,
    dataSourceMDSId
  );
  const [isOperating, setIsOperating] = useState(false);
  const [operationSuccess, setOperationSuccess] = useState(false);
  const [accelerationToOperate, setAccelerationToOperate] = useState<CachedAcceleration | null>(
    null
  );
  const [operationType, setOperationType] = useState<AccelerationActionType | null>(null);
  const [currentStatus, setCurrentStatus] = useState<DirectQueryLoadingStatus | null>(null);

  useEffect(() => {
    if (!accelerationToOperate || !operationType || loadStatus === currentStatus) return;

    const displayAccelerationName = getAccelerationName(accelerationToOperate);

    let operationInProgressMessage = '';
    let operationSuccessMessage = '';
    let operationFailureMessage = '';

    switch (operationType) {
      case 'delete':
        operationInProgressMessage = `Deleting acceleration: ${displayAccelerationName}`;
        operationSuccessMessage = `Successfully deleted acceleration: ${displayAccelerationName}`;
        operationFailureMessage = `Failed to delete acceleration: ${displayAccelerationName}`;
        break;
      case 'vacuum':
        operationInProgressMessage = `Vacuuming acceleration: ${displayAccelerationName}`;
        operationSuccessMessage = `Successfully vacuumed acceleration: ${displayAccelerationName}`;
        operationFailureMessage = `Failed to vacuum acceleration: ${displayAccelerationName}`;
        break;
      case 'sync':
        operationInProgressMessage = `Syncing acceleration: ${displayAccelerationName}`;
        break;
    }

    if (loadStatus === DirectQueryLoadingStatus.SCHEDULED && operationType !== 'sync') {
      setIsOperating(true);
      notifications.toasts.addSuccess(operationInProgressMessage);
    } else if (loadStatus === DirectQueryLoadingStatus.SUCCESS && operationType !== 'sync') {
      setIsOperating(false);
      setAccelerationToOperate(null);
      setOperationSuccess(true);
      notifications.toasts.addSuccess(operationSuccessMessage);
    } else if (loadStatus === DirectQueryLoadingStatus.FAILED && operationType !== 'sync') {
      setIsOperating(false);
      setOperationSuccess(false);
      notifications.toasts.addDanger(operationFailureMessage);
    } else if (operationType === 'sync' && loadStatus === DirectQueryLoadingStatus.SCHEDULED) {
      notifications.toasts.addSuccess(operationInProgressMessage);
      stopLoading();
    }

    setCurrentStatus(loadStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadStatus, accelerationToOperate, operationType, currentStatus]);

  useEffect(() => {
    return () => {
      stopLoading();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performOperation = (
    acceleration: CachedAcceleration,
    operation: AccelerationActionType
  ) => {
    setOperationSuccess(false);
    setOperationType(operation);
    const operationQuery = generateAccelerationOperationQuery(acceleration, dataSource, operation);

    const requestPayload = {
      lang: 'sql',
      query: operationQuery,
      datasource: dataSource,
    };

    setIsOperating(true);
    setAccelerationToOperate(acceleration);
    startLoading(requestPayload);
  };

  return { performOperation, isOperating, operationSuccess };
};
