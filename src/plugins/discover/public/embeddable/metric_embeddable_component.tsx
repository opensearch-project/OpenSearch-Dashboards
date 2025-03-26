/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import {
  DataGridTable,
  DataGridTableProps,
} from '../application/components/data_grid/data_grid_table';
import './search_embeddable.scss';
import {
  OpenSearchDashboardsContextProvider,
  useOpenSearchDashboards,
} from '../../../opensearch_dashboards_react/public';
import { MetricProps } from './metric_embeddable';
import { DiscoverServices, DiscoverViewServices } from '../build_services';
import { style } from '../../../expressions/common/expression_types/specs/style';

interface MetricEmbeddableProps {
  metricProps: MetricProps;
  services: DiscoverServices;
}

export const DataGridTableMemoized = React.memo((props: DataGridTableProps) => (
  <DataGridTable {...props} />
));

export function MetricEmbeddableComponent({ metricProps, services }: MetricEmbeddableProps) {
  const {
    expressions: { ReactExpressionRenderer },
  } = services;
  const discoverEmbeddableProps = {
    services: metricProps.services,
    expression: metricProps.expression,
    title: metricProps.title,
  };

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <EuiFlexGroup
          gutterSize="xs"
          direction="column"
          responsive={false}
          data-test-subj="embeddedSavedMetric"
          className="eui-xScrollWithShadows eui-yScrollWithShadows"
        >
          <EuiFlexItem data-test-subj="metricEmbeddableContainer" style={{ width: '100%' }}>
            <EuiPanel data-test-subj="visualizationLoader">
              <ReactExpressionRenderer expression={discoverEmbeddableProps.expression} />
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
}
