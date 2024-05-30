/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { withOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import type { QueryEditorTopRowProps } from './query_editor_top_row';
import type { QueryStringInputProps } from './query_editor';

const Fallback = () => <div />;

const LazyQueryEditorTopRow = React.lazy(() => import('./query_editor_top_row'));
export const QueryEditorTopRow = (props: QueryEditorTopRowProps) => (
  <React.Suspense fallback={<Fallback />}>
    <LazyQueryEditorTopRow {...props} />
  </React.Suspense>
);

const LazyQueryStringInputUI = withOpenSearchDashboards(React.lazy(() => import('./query_editor')));
export const QueryStringInput = (props: QueryStringInputProps) => (
  <React.Suspense fallback={<Fallback />}>
    <LazyQueryStringInputUI {...props} />
  </React.Suspense>
);
export type { QueryStringInputProps };
