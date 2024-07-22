/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner, EuiSpacer } from '@elastic/eui';
import React from 'react';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { CreateAccelerationForm } from '../../../../../framework/types';
import { CoveringIndexBuilder } from './covering_index/covering_index_builder';
import { MaterializedViewBuilder } from './materialized_view/materialized_view_builder';
import { SkippingIndexBuilder } from './skipping_index/skipping_index_builder';

interface QueryVisualEditorProps {
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
  tableFieldsLoading: boolean;
  dataSourceMDSId?: string;
  http: HttpStart;
  notifications: NotificationsStart;
}

export const QueryVisualEditor = ({
  accelerationFormData,
  setAccelerationFormData,
  tableFieldsLoading,
  dataSourceMDSId,
  http,
  notifications,
}: QueryVisualEditorProps) => {
  return tableFieldsLoading ? (
    <>
      <EuiFlexGroup alignItems="center" gutterSize="s" direction="column">
        <EuiSpacer />
        <EuiFlexItem>
          <EuiLoadingSpinner size="l" />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>Loading tables fields</EuiFlexItem>
      </EuiFlexGroup>
    </>
  ) : (
    <>
      <EuiSpacer size="l" />
      {accelerationFormData.accelerationIndexType === 'skipping' && (
        <SkippingIndexBuilder
          accelerationFormData={accelerationFormData}
          setAccelerationFormData={setAccelerationFormData}
          dataSourceMDSId={dataSourceMDSId}
          http={http}
          notifications={notifications}
        />
      )}
      {accelerationFormData.accelerationIndexType === 'covering' && (
        <CoveringIndexBuilder
          accelerationFormData={accelerationFormData}
          setAccelerationFormData={setAccelerationFormData}
        />
      )}
      {accelerationFormData.accelerationIndexType === 'materialized' && (
        <MaterializedViewBuilder
          accelerationFormData={accelerationFormData}
          setAccelerationFormData={setAccelerationFormData}
        />
      )}
    </>
  );
};
