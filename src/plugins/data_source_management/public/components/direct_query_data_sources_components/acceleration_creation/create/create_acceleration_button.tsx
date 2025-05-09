/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { SANITIZE_QUERY_REGEX } from '../../../../../framework/constants';
import {
  DirectQueryLoadingStatus,
  DirectQueryRequest,
  CreateAccelerationForm,
} from '../../../../../framework/types';
import { useDirectQuery } from '../../../../../framework/hooks/direct_query_hook';
import { accelerationQueryBuilder } from '../visual_editors/query_builder';
import { formValidator, hasError } from './utils';

interface CreateAccelerationButtonProps {
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
  resetFlyout: () => void;
  refreshHandler?: () => void;
  http: HttpStart;
  notifications: NotificationsStart;
  dataSourceMDSId: string;
}

export const CreateAccelerationButton = ({
  accelerationFormData,
  setAccelerationFormData,
  resetFlyout,
  refreshHandler,
  http,
  notifications,
  dataSourceMDSId,
}: CreateAccelerationButtonProps) => {
  const { loadStatus: directqueryLoadStatus, startLoading: startDirectQuery } = useDirectQuery(
    http,
    notifications,
    dataSourceMDSId
  );
  const [isLoading, setIsLoading] = useState(false);

  const createAcceleration = () => {
    const errors = formValidator(accelerationFormData);
    if (hasError(errors)) {
      setAccelerationFormData({ ...accelerationFormData, formErrors: errors });
      return;
    }

    const requestPayload: DirectQueryRequest = {
      lang: 'sql',
      query: accelerationQueryBuilder(accelerationFormData).replaceAll(SANITIZE_QUERY_REGEX, ' '),
      datasource: accelerationFormData.dataSource,
    };

    startDirectQuery(requestPayload);
    setIsLoading(true);
  };

  useEffect(() => {
    const status = directqueryLoadStatus.toLowerCase();
    if (status === DirectQueryLoadingStatus.SUCCESS.toLowerCase()) {
      setIsLoading(false);
      notifications.toasts.addSuccess('Create acceleration query submitted successfully!');
      if (refreshHandler) refreshHandler();
      resetFlyout();
    } else if (
      status === DirectQueryLoadingStatus.FAILED.toLowerCase() ||
      status === DirectQueryLoadingStatus.CANCELLED.toLowerCase() ||
      status === DirectQueryLoadingStatus.INITIAL.toLowerCase() ||
      status === DirectQueryLoadingStatus.FRESH.toLowerCase()
    ) {
      setIsLoading(false);
    } else if (
      status === DirectQueryLoadingStatus.SUBMITTED.toLowerCase() ||
      status === DirectQueryLoadingStatus.WAITING.toLowerCase() ||
      status === DirectQueryLoadingStatus.RUNNING.toLowerCase() ||
      status === DirectQueryLoadingStatus.SCHEDULED.toLowerCase()
    ) {
      setIsLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directqueryLoadStatus]);

  const createAccelerationBtn = (
    <EuiButton onClick={createAcceleration} fill isLoading={isLoading}>
      {isLoading ? 'Creating acceleration' : 'Create acceleration'}
    </EuiButton>
  );

  return createAccelerationBtn;
};
