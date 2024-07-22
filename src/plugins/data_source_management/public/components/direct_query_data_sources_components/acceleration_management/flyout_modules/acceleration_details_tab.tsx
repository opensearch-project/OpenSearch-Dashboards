/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLink,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { AccelerationHealth, AccelerationStatus } from '../acceleration_utils';

interface AccelerationDetailsTabProps {
  acceleration: {
    flintIndexName: string;
    kind: string;
    database: string;
    table: string;
    indexName: string;
    autoRefresh: boolean;
    status: string;
  };
  settings: object;
  mappings: object;
  indexInfo: any;
  dataSourceName: string;
  resetFlyout: () => void;
  application: ApplicationStart;
  featureFlagStatus: boolean;
  dataSourceMDSId?: string;
}

export const AccelerationDetailsTab = ({
  acceleration,
  settings,
  mappings,
  indexInfo,
  dataSourceName,
  resetFlyout,
  application,
  featureFlagStatus,
  dataSourceMDSId,
}: AccelerationDetailsTabProps) => {
  const isSkippingIndex =
    mappings?.data?.[acceleration.flintIndexName]?.mappings?._meta?.kind === 'skipping';
  const refreshIntervalDescription = acceleration.autoRefresh ? 'Auto refresh' : 'Manual';
  const showRefreshTime =
    acceleration.autoRefresh ||
    mappings?.data?.[acceleration.flintIndexName]?.mappings?._meta?.options.incremental_refresh;
  const refreshTime = showRefreshTime
    ? mappings?.data?.[acceleration.flintIndexName]?.mappings?._meta?.options.refresh_interval ??
      '-'
    : '-';
  const creationDate = new Date(
    parseInt(settings?.settings?.index?.creation_date, 10)
  ).toLocaleString();
  const checkpointName =
    mappings?.data?.[acceleration.flintIndexName]?.mappings?._meta?.options?.checkpoint_location;
  const DetailComponent = ({
    title,
    description,
  }: {
    title: string;
    description: React.ReactNode;
  }) => (
    <EuiFlexItem>
      <EuiDescriptionList>
        <EuiDescriptionListTitle>{title}</EuiDescriptionListTitle>
        <EuiDescriptionListDescription>{description}</EuiDescriptionListDescription>
      </EuiDescriptionList>
    </EuiFlexItem>
  );

  const TitleComponent = ({ title }: { title: string }) => (
    <>
      <EuiTitle size="s">
        <h4>{title}</h4>
      </EuiTitle>
      <EuiHorizontalRule margin="s" />
    </>
  );

  return (
    <>
      <EuiSpacer />
      <EuiFlexGroup direction="row">
        <DetailComponent
          title="Status"
          description={<AccelerationStatus status={acceleration.status} />}
        />
        <DetailComponent
          title="Acceleration Type"
          description={mappings?.data?.[acceleration.flintIndexName]?.mappings?._meta?.kind}
        />
        <DetailComponent title="Creation Date" description={creationDate} />
      </EuiFlexGroup>
      <EuiSpacer />
      <TitleComponent title="Data source details" />
      <EuiFlexGroup direction="row">
        <DetailComponent
          title="Data source connection"
          description={
            <EuiLink
              onClick={() => {
                const path =
                  featureFlagStatus && dataSourceMDSId
                    ? `/opensearch-dashboards/dataSources/manage/${dataSourceName}?dataSourceMDSId=${dataSourceMDSId}`
                    : `/opensearch-dashboards/dataSources/manage/${dataSourceName}`;
                application.navigateToApp('management', {
                  path,
                  replace: true,
                });
                resetFlyout();
              }}
            >
              {dataSourceName}
            </EuiLink>
          }
        />
        <DetailComponent title="Database" description={acceleration.database} />
        <DetailComponent title="Table" description={acceleration.table || '-'} />
      </EuiFlexGroup>
      {!isSkippingIndex && (
        <>
          <EuiSpacer />
          <TitleComponent title="Index details" />
          <EuiFlexGroup>
            <DetailComponent title="Index name" description={indexInfo?.data[0]?.index} />
            <DetailComponent
              title="Health"
              description={<AccelerationHealth health={indexInfo?.data[0]?.health} />}
            />
          </EuiFlexGroup>
        </>
      )}
      <EuiSpacer />
      <TitleComponent title="Refresh Details" />
      <EuiFlexGroup direction="row">
        <DetailComponent title="Refresh type" description={refreshIntervalDescription} />
        <DetailComponent title="Refresh time" description={refreshTime} />
        {checkpointName && (
          <DetailComponent title="Checkpoint location" description={checkpointName} />
        )}
      </EuiFlexGroup>
    </>
  );
};
