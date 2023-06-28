/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DiscoverCanvas } from './discover_canvas';

export const createCanvas = () => {
  const LazyDiscoverCanvas = React.lazy(DiscoverCanvas);

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <LazyDiscoverCanvas />
    </React.Suspense>
  );
};
