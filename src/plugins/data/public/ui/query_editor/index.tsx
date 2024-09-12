/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { withOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import type { QueryEditorTopRowProps } from './query_editor_top_row';
import type { QueryEditorProps } from './query_editor';

const Fallback = () => null;

const LazyQueryEditorTopRow = React.lazy(() => import('./query_editor_top_row'));
export const QueryEditorTopRow = (props: QueryEditorTopRowProps) => (
  <React.Suspense fallback={<Fallback />}>
    <LazyQueryEditorTopRow {...props} />
  </React.Suspense>
);

const LazyQueryEditorUI = withOpenSearchDashboards(React.lazy(() => import('./query_editor')));
export const QueryEditor = (props: QueryEditorProps) => (
  <React.Suspense fallback={<Fallback />}>
    <LazyQueryEditorUI {...props} />
  </React.Suspense>
);
export type { QueryEditorProps };

export {
  QueryEditorExtensions,
  QueryEditorExtensionDependencies,
  QueryEditorExtensionConfig,
} from './query_editor_extensions';

export { createEditor, DefaultInput, DQLBody, SingleLineInput } from './editors';
