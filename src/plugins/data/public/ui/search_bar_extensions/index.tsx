/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ComponentProps } from 'react';

const Fallback = () => <div />;

const LazySearchBarExtensions = React.lazy(() => import('./search_bar_extensions'));
export const SearchBarExtensions = (props: ComponentProps<typeof LazySearchBarExtensions>) => (
  <React.Suspense fallback={<Fallback />}>
    <LazySearchBarExtensions {...props} />
  </React.Suspense>
);

export { SearchBarExtensionConfig } from './search_bar_extension';
