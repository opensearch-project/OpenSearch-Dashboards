/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiPanel, EuiCard, EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiIcon } from '@elastic/eui';
import React from 'react';
import { History } from 'history';
import s3Svg from '../direct_query_data_sources_components/icons/s3_logo.svg';
import prometheusSvg from '../direct_query_data_sources_components/icons/prometheus_logo.svg';
import opensearchLogSvg from '../direct_query_data_sources_components/icons/opensearch_logo.svg';
import { AMAZON_S3_URL, PROMETHEUS_URL, OPENSEARCH_URL } from '../../constants';

export interface DatasourceCard {
  name: string;
  displayName: string;
  description: string;
  displayIcon: JSX.Element;
  onClick: () => void;
}

interface CreateDataSourceCardViewProps {
  history: History;
  featureFlagStatus: boolean;
}

export function CreateDataSourceCardView({
  history,
  featureFlagStatus,
}: CreateDataSourceCardViewProps) {
  const Datasources: DatasourceCard[] = [
    {
      name: 'S3GLUE',
      displayName: 'Amazon S3',
      description: 'Connect to Amazon S3 via AWS Glue Data Catalog',
      displayIcon: <EuiIcon type={s3Svg} size="xl" />,
      onClick: () => history.push(`/configure/${AMAZON_S3_URL}`),
    },
    {
      name: 'PROMETHEUS',
      displayName: 'Prometheus',
      description: 'Connect to Prometheus',
      displayIcon: <EuiIcon type={prometheusSvg} size="xl" />,
      onClick: () => history.push(`/configure/${PROMETHEUS_URL}`),
    },
    ...(featureFlagStatus
      ? [
          {
            name: 'OPENSEARCH',
            displayName: 'OpenSearch',
            description: 'Connect to OpenSearch',
            displayIcon: <EuiIcon type={opensearchLogSvg} size="xl" />,
            onClick: () => history.push(`/configure/${OPENSEARCH_URL}`),
          },
        ]
      : []),
  ];

  const renderRows = (datasources: DatasourceCard[]) => {
    return (
      <>
        <EuiFlexGroup gutterSize="l" style={{ flexWrap: 'wrap' }}>
          {datasources.map((i) => (
            <EuiFlexItem key={i.name} style={{ minWidth: '14rem', maxWidth: '14rem' }}>
              <EuiCard
                icon={i.displayIcon}
                title={i.displayName}
                description={i.description}
                data-test-subj={`datasource_card_${i.name.toLowerCase()}`}
                titleElement="span"
                onClick={i.onClick}
              />
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
        <EuiSpacer />
      </>
    );
  };

  return <EuiPanel>{renderRows(Datasources)}</EuiPanel>;
}
