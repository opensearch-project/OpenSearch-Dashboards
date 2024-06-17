/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ComponentProps } from 'react';

const Fallback = () => <div />;

const LazyQueryEditorExtensions = React.lazy(() => import('./query_editor_extensions'));
export const QueryEditorExtensions = (props: ComponentProps<typeof LazyQueryEditorExtensions>) => (
  <React.Suspense fallback={<Fallback />}>
    <LazyQueryEditorExtensions {...props} />
  </React.Suspense>
);

export { QueryEditorExtensionConfig } from './query_editor_extension';
