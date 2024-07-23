/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton, EuiConfirmModal } from '@elastic/eui';
import producer from 'immer';
import React, { useEffect, useState } from 'react';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import {
  CreateAccelerationForm,
  SkippingIndexRowType,
  DirectQueryLoadingStatus,
  DirectQueryRequest,
} from '../../../../../../framework/types';
import {
  addBackticksIfNeeded,
  combineSchemaAndDatarows,
} from '../../../../../../framework/utils/shared';
import { useDirectQuery } from '../../../../../../framework/hooks/direct_query_hook';
import { validateSkippingIndexData } from '../../create/utils';

interface GenerateFieldsProps {
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
  isSkippingtableLoading: boolean;
  setIsSkippingtableLoading: React.Dispatch<boolean>;
  dataSourceMDSId?: string;
  http: HttpStart;
  notifications: NotificationsStart;
}

export const GenerateFields = ({
  accelerationFormData,
  setAccelerationFormData,
  isSkippingtableLoading,
  setIsSkippingtableLoading,
  dataSourceMDSId,
  http,
  notifications,
}: GenerateFieldsProps) => {
  const [isGenerateRun, setIsGenerateRun] = useState(false);
  const { loadStatus, startLoading, stopLoading: _stopLoading, pollingResult } = useDirectQuery(
    http,
    notifications,
    dataSourceMDSId
  );
  const [replaceDefinitionModal, setReplaceDefinitionModal] = useState(<></>);

  const mapToDataTableFields = (fieldName: string) => {
    return accelerationFormData.dataTableFields.find((field) => field.fieldName === fieldName);
  };

  const loadSkippingIndexDefinition = () => {
    const combinedData = combineSchemaAndDatarows(pollingResult.schema, pollingResult.datarows);
    const skippingIndexRows = combinedData.map((field: any) => {
      return {
        ...mapToDataTableFields(field.column_name),
        accelerationMethod: field.skipping_type.split(' ')[0],
      } as SkippingIndexRowType;
    });
    setAccelerationFormData(
      producer((accData) => {
        accData.skippingIndexQueryData = skippingIndexRows;
        accData.formErrors.skippingIndexError = validateSkippingIndexData(
          accData.accelerationIndexType,
          skippingIndexRows
        );
      })
    );
  };

  useEffect(() => {
    const status = loadStatus.toLowerCase();
    if (status === DirectQueryLoadingStatus.SUCCESS) {
      loadSkippingIndexDefinition();
      setIsSkippingtableLoading(false);
    } else if (
      status === DirectQueryLoadingStatus.FAILED ||
      status === DirectQueryLoadingStatus.CANCELED
    ) {
      setIsSkippingtableLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadStatus]);

  const runGeneration = () => {
    const requestPayload: DirectQueryRequest = {
      lang: 'sql',
      query: `ANALYZE SKIPPING INDEX ON ${addBackticksIfNeeded(
        accelerationFormData.dataSource
      )}.${addBackticksIfNeeded(accelerationFormData.database)}.${addBackticksIfNeeded(
        accelerationFormData.dataTable
      )}`,
      datasource: accelerationFormData.dataSource,
    };
    startLoading(requestPayload, dataSourceMDSId);
    setIsSkippingtableLoading(true);
    setIsGenerateRun(true);
    setReplaceDefinitionModal(<></>);
  };

  const replaceModalComponent = (
    <EuiConfirmModal
      title="Replace definitions?"
      onCancel={() => setReplaceDefinitionModal(<></>)}
      onConfirm={runGeneration}
      cancelButtonText="Cancel"
      confirmButtonText="Replace"
      defaultFocusedButton="confirm"
    >
      <p>
        Existing definitions will be removed and replaced with auto-generated definitions. Do you
        want to continue?
      </p>
    </EuiConfirmModal>
  );

  const onClickGenerate = () => {
    if (accelerationFormData.skippingIndexQueryData.length > 0) {
      setReplaceDefinitionModal(replaceModalComponent);
    } else {
      runGeneration();
    }
  };

  return (
    <>
      <EuiButton onClick={onClickGenerate} isDisabled={isSkippingtableLoading}>
        {isGenerateRun ? 'Regenerate' : 'Generate'}
      </EuiButton>
      {replaceDefinitionModal}
    </>
  );
};
