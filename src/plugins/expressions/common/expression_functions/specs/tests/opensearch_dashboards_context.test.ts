/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Filter } from '../../../../../data/common';
import { OpenSearchDashboardsContext } from '../../../expression_types';
import { opensearchDashboardsContextFunction } from '../opensearch_dashboards_context';
import { functionWrapper } from './utils';

const createFilter = (alias: string, disabled: boolean, negate = false): Filter =>
  ({
    meta: {
      alias,
      disabled,
      negate,
    },
    query: {
      match_phrase: {
        cancelled: true,
      },
    },
  }) as Filter;

describe('interpreter/functions#opensearch-dashboards-context', () => {
  const fn = functionWrapper(opensearchDashboardsContextFunction);

  it('removes disabled filters before deduplicating duplicates', async () => {
    const dashboardFilter = createFilter('dashboard filter', true);
    const visualizationFilter = createFilter('visualization filter', false);
    const input: OpenSearchDashboardsContext = {
      type: 'opensearch_dashboards_context',
      filters: [dashboardFilter],
    };

    const actual = await fn(input, { filters: JSON.stringify([visualizationFilter]) });

    expect(actual.filters).toEqual([visualizationFilter]);
  });

  it('keeps one filter when matching dashboard and visualization filters are enabled', async () => {
    const dashboardFilter = createFilter('dashboard filter', false);
    const visualizationFilter = createFilter('visualization filter', false);
    const input: OpenSearchDashboardsContext = {
      type: 'opensearch_dashboards_context',
      filters: [dashboardFilter],
    };

    const actual = await fn(input, { filters: JSON.stringify([visualizationFilter]) });

    expect(actual.filters).toEqual([dashboardFilter]);
  });

  it('keeps a negated visualization filter when the matching dashboard filter is enabled', async () => {
    const dashboardFilter = createFilter('dashboard filter', false);
    const visualizationFilter = createFilter('visualization filter', false, true);
    const input: OpenSearchDashboardsContext = {
      type: 'opensearch_dashboards_context',
      filters: [dashboardFilter],
    };

    const actual = await fn(input, { filters: JSON.stringify([visualizationFilter]) });

    expect(actual.filters).toEqual([dashboardFilter, visualizationFilter]);
  });

  it('keeps a visualization filter when the matching dashboard filter is negated', async () => {
    const dashboardFilter = createFilter('dashboard filter', false, true);
    const visualizationFilter = createFilter('visualization filter', false);
    const input: OpenSearchDashboardsContext = {
      type: 'opensearch_dashboards_context',
      filters: [dashboardFilter],
    };

    const actual = await fn(input, { filters: JSON.stringify([visualizationFilter]) });

    expect(actual.filters).toEqual([dashboardFilter, visualizationFilter]);
  });
});
