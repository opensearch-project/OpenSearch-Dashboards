/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { ReactFlowProvider } from '@xyflow/react';

import { Celestial } from './Celestial';
import type { CelestialMapProps } from './types';
import { CelestialStateProvider } from './shared/contexts/CelestialStateContext';

export const CelestialMap = (props: CelestialMapProps) => (
  <ReactFlowProvider>
    <CelestialStateProvider>
      <Celestial {...props} />
    </CelestialStateProvider>
  </ReactFlowProvider>
);
