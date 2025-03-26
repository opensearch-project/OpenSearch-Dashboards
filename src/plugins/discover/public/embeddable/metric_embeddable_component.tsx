/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
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
import { DiscoverViewServices } from '../build_services';

interface MetricEmbeddableProps {
  metricProps: MetricProps;
}

export const DataGridTableMemoized = React.memo((props: DataGridTableProps) => (
  <DataGridTable {...props} />
));

export function MetricEmbeddableComponent({ metricProps }: MetricEmbeddableProps) {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    expressions: { ReactExpressionRenderer },
  } = services;
  const discoverEmbeddableProps = {
    services: metricProps.services,
    expression: metricProps.expression,
    title: metricProps.title,
  };

  console.log('expression in embeddable', discoverEmbeddableProps.expression);

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
          <EuiFlexItem
            style={{ minHeight: 0 }}
            className="osdDocTable__container"
            data-test-subj="osdDocTableContainer"
          >
            <ReactExpressionRenderer expression={discoverEmbeddableProps.expression} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
}
