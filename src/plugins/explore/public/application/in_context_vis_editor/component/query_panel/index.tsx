/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { QueryPanelProps } from './query_panel_context';
export { QueryPanelProvider, useQueryPanelContext } from './query_panel_context';

const Fallback = () => <div />;

const LazyQueryPanel = React.lazy(() => import('./visualization_editor_query_panel'));
export const QueryPanel = (props: QueryPanelProps) => (
  <React.Suspense fallback={<Fallback />}>
    <LazyQueryPanel {...props} />
  </React.Suspense>
);

export { QueryPanelProps } from './query_panel_context';
