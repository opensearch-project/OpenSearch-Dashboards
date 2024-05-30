/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiPanel, EuiCard, EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiIcon } from '@elastic/eui';
import React from 'react';
import { NewDatasourceDescription } from './create_data_source_description';
import s3Svg from '../flint_data_sources_components/icons/s3_logo.svg';
import prometheusSvg from '../flint_data_sources_components/icons/prometheus_logo.svg';
import { DatasourceType } from '../../types';
import { AmazonS3URL, PrometheusURL } from '../../constants';

export interface DatasourceCard {
  name: DatasourceType;
  displayName: string;
  description: string;
  displayIcon: JSX.Element;
  onClick: () => void;
}

export function CreateDataSourceCardView() {
  const Datasources: DatasourceCard[] = [
    {
      name: 'S3GLUE',
      displayName: 'Amazon S3',
      description: 'Connect to Amazon S3 via AWS Glue Data Catalog',
      displayIcon: <EuiIcon type={s3Svg} size="xl" />,
      onClick: () => (window.location.hash = `#/configure/${AmazonS3URL}`),
    },
    {
      name: 'PROMETHEUS',
      displayName: 'Prometheus',
      description: 'Connect to Prometheus',
      displayIcon: <EuiIcon type={prometheusSvg} size="xl" />,
      onClick: () => (window.location.hash = `#/configure/${PrometheusURL}`),
    },
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

  return (
    <EuiPanel>
      <NewDatasourceDescription />
      {renderRows(Datasources)}
    </EuiPanel>
  );
}
